using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using RealEstate.Api.Data;
using RealEstate.Api.Models;
using RealEstate.Api.Services;

// Enable legacy timestamp behavior for Npgsql to prevent DateTime UTC casting mismatch
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

// ── 1. Configure PostgreSQL Connection String ──────────────────────────────
var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
string connectionString;

if (!string.IsNullOrEmpty(databaseUrl) && (databaseUrl.StartsWith("postgres://") || databaseUrl.StartsWith("postgresql://")))
{
    var uri = new Uri(databaseUrl);
    var userInfo = uri.UserInfo.Split(':');
    var port = uri.Port > 0 ? uri.Port : 5432;
    connectionString = $"Host={uri.Host};Port={port};Database={uri.AbsolutePath.TrimStart('/')};Username={userInfo[0]};Password={(userInfo.Length > 1 ? userInfo[1] : "")};SSL Mode=Prefer;Trust Server Certificate=true";
}
else
{
    connectionString = builder.Configuration.GetConnectionString("DefaultConnection")!;
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// Password Hasher service
builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();

// Cloudinary Image Service
builder.Services.Configure<CloudinarySettings>(builder.Configuration.GetSection("CloudinarySettings"));
builder.Services.AddScoped<IPhotoService, PhotoService>();

// JWT Authentication Configuration
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["Secret"] ?? "SasrikaRealEstateSuperSecretKey2026!MustBeLongEnoughForHmacSha256SecurityRequirement";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
        ValidateIssuer = true,
        ValidIssuer = jwtSettings["Issuer"] ?? "SasrikaRealEstate",
        ValidateAudience = true,
        ValidAudience = jwtSettings["Audience"] ?? "SasrikaRealEstateApp",
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// CORS Configuration
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.SetIsOriginAllowed(origin => true)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Ensure wwwroot/uploads directory exists so UseStaticFiles can serve uploaded photos
var uploadsDir = Path.Combine(builder.Environment.ContentRootPath, "wwwroot", "uploads");
if (!Directory.Exists(uploadsDir))
{
    Directory.CreateDirectory(uploadsDir);
}

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// ── 2. Database Migration / Schema Creation & Seed Data ─────────────────────
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    try
    {
        var db = services.GetRequiredService<AppDbContext>();
        var passwordHasher = services.GetRequiredService<IPasswordHasher<User>>();

        // Create database tables if they do not exist
        db.Database.EnsureCreated();

        // Safely ensure PostgreSQL tables and columns exist even on pre-created databases
        try
        {
            db.Database.ExecuteSqlRaw(@"
                CREATE TABLE IF NOT EXISTS ""Users"" (
                    ""Id"" uuid NOT NULL PRIMARY KEY,
                    ""FirstName"" text NOT NULL,
                    ""LastName"" text NOT NULL,
                    ""Email"" text NOT NULL,
                    ""PasswordHash"" text NULL,
                    ""PhoneNumber"" text NULL,
                    ""ProfilePictureUrl"" text NULL,
                    ""Role"" text NOT NULL DEFAULT 'User',
                    ""GoogleId"" text NULL,
                    ""CreatedAt"" timestamp with time zone NOT NULL
                );
                CREATE UNIQUE INDEX IF NOT EXISTS ""IX_Users_Email"" ON ""Users"" (""Email"");

                CREATE TABLE IF NOT EXISTS ""Properties"" (
                    ""Id"" uuid NOT NULL PRIMARY KEY,
                    ""ReferenceCode"" text NOT NULL,
                    ""Title"" text NOT NULL,
                    ""Description"" text NOT NULL,
                    ""Price"" numeric NOT NULL,
                    ""IsNegotiable"" boolean NOT NULL,
                    ""City"" text NOT NULL,
                    ""District"" text NOT NULL,
                    ""PropertyType"" integer NOT NULL,
                    ""ListingType"" integer NOT NULL,
                    ""LandSizePerches"" numeric NULL,
                    ""Bedrooms"" integer NULL,
                    ""Bathrooms"" integer NULL,
                    ""PricePerPerch"" numeric NULL,
                    ""ImageUrls"" text NOT NULL,
                    ""SellerName"" text NOT NULL,
                    ""SellerPhone"" text NOT NULL,
                    ""ViewCount"" integer NOT NULL DEFAULT 0,
                    ""CreatedAt"" timestamp with time zone NOT NULL,
                    ""Status"" integer NOT NULL DEFAULT 0,
                    ""RejectionReason"" text NULL,
                    ""ModeratedAt"" timestamp with time zone NULL,
                    ""IsSold"" boolean NOT NULL DEFAULT false,
                    ""UserId"" uuid NULL REFERENCES ""Users"" (""Id"") ON DELETE SET NULL
                );
                CREATE INDEX IF NOT EXISTS ""IX_Properties_UserId"" ON ""Properties"" (""UserId"");
            ");
        }
        catch (Exception ddlEx)
        {
            logger.LogWarning(ddlEx, "Secondary DDL check completed: {Message}", ddlEx.Message);
        }

        // Ensure a default Admin user exists
        var adminEmail = "admin@sasrika.lk";
        var adminUser = db.Users.FirstOrDefault(u => u.Email == adminEmail);
        if (adminUser == null)
        {
            adminUser = new User
            {
                Id = Guid.NewGuid(),
                FirstName = "Sasrika",
                LastName = "Admin",
                Email = adminEmail,
                PhoneNumber = "0771234567",
                Role = "Admin",
                CreatedAt = DateTime.UtcNow
            };
            adminUser.PasswordHash = passwordHasher.HashPassword(adminUser, "Admin@2026");
            db.Users.Add(adminUser);
            db.SaveChanges();
            logger.LogInformation("Default Admin user seeded successfully.");
        }

        // Link any orphan properties to the adminUser
        var orphanProperties = db.Properties.Where(p => p.UserId == null).ToList();
        if (orphanProperties.Count > 0)
        {
            foreach (var p in orphanProperties)
            {
                p.UserId = adminUser.Id;
                if (string.IsNullOrWhiteSpace(p.SellerName)) p.SellerName = $"{adminUser.FirstName} {adminUser.LastName}";
                if (string.IsNullOrWhiteSpace(p.SellerPhone)) p.SellerPhone = adminUser.PhoneNumber ?? "0771234567";
            }
            db.SaveChanges();
        }

        // Ensure PricePerPerch is strictly null for non-Land or non-ForSale properties
        var invalidPerchListings = db.Properties
            .Where(p => (p.ListingType != ListingType.ForSale || p.PropertyType != PropertyType.Land) && p.PricePerPerch != null)
            .ToList();
        if (invalidPerchListings.Count > 0)
        {
            foreach (var item in invalidPerchListings)
            {
                item.PricePerPerch = null;
            }
            db.SaveChanges();
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "An error occurred while initializing or seeding the database.");
    }
}

app.Run();