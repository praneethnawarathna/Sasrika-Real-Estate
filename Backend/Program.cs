using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using RealEstate.Api.Data;
using RealEstate.Api.Models;
using RealEstate.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Configure PostgreSQL Database
var rawConnectionString = Environment.GetEnvironmentVariable("DATABASE_URL")
    ?? builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Host=localhost;Port=5432;Database=sasrikadb;Username=postgres;Password=postgres;SSL Mode=Prefer;Trust Server Certificate=true";

var connectionString = ParsePostgreSqlConnectionString(rawConnectionString);

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

// Database Migration / Initialization & Seed Data
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

// Helper method to parse PostgreSQL URI format (postgres:// or postgresql://) into standard Npgsql connection string
static string ParsePostgreSqlConnectionString(string rawConnection)
{
    if (string.IsNullOrWhiteSpace(rawConnection))
    {
        return rawConnection;
    }

    if (rawConnection.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase) ||
        rawConnection.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase))
    {
        var uri = new Uri(rawConnection);
        var userInfoParts = uri.UserInfo.Split(':', 2);
        var username = userInfoParts.Length > 0 ? Uri.UnescapeDataString(userInfoParts[0]) : "";
        var password = userInfoParts.Length > 1 ? Uri.UnescapeDataString(userInfoParts[1]) : "";
        var host = uri.Host;
        var port = uri.Port > 0 ? uri.Port : 5432;
        var database = uri.AbsolutePath.TrimStart('/');

        return $"Host={host};Port={port};Database={database};Username={username};Password={password};SSL Mode=Prefer;Trust Server Certificate=true";
    }

    return rawConnection;
}