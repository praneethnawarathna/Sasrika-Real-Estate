using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using RealEstate.Api.Data;
using RealEstate.Api.Models;
using RealEstate.Api.Services;

// Required for Npgsql: treat DateTime as UTC without offset issues
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

// ── 1. PostgreSQL Connection String ──────────────────────────────────────────
var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
string connectionString;

if (!string.IsNullOrEmpty(databaseUrl) &&
    (databaseUrl.StartsWith("postgres://") || databaseUrl.StartsWith("postgresql://")))
{
    var uri = new Uri(databaseUrl);
    var userInfo = uri.UserInfo.Split(':');
    connectionString = $"Host={uri.Host};" +
                       $"Port={uri.Port};" +
                       $"Database={uri.AbsolutePath.TrimStart('/')};" +
                       $"Username={userInfo[0]};" +
                       $"Password={(userInfo.Length > 1 ? userInfo[1] : "")};" +
                       "SSL Mode=Require;Trust Server Certificate=true";
}
else
{
    connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
        ?? "Host=postgres.railway.internal;Port=5432;Database=railway;Username=postgres;Password=YUfSACkNVkicBsymPigctbaSSgTzChCz;SSL Mode=Prefer;Trust Server Certificate=true";
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// ── 2. Services ──────────────────────────────────────────────────────────────
builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();

builder.Services.Configure<CloudinarySettings>(builder.Configuration.GetSection("CloudinarySettings"));
builder.Services.AddScoped<IPhotoService, PhotoService>();

// ── 3. JWT Authentication ─────────────────────────────────────────────────────
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

// ── 4. CORS — default policy, allows any origin + credentials ────────────────
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
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

// Ensure wwwroot/uploads directory exists for legacy local image serving
var uploadsDir = Path.Combine(builder.Environment.ContentRootPath, "wwwroot", "uploads");
if (!Directory.Exists(uploadsDir))
    Directory.CreateDirectory(uploadsDir);

// ── 5. Build App ──────────────────────────────────────────────────────────────
var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Middleware ordering: CORS must come before Auth
app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseCors(); // uses default policy
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// ── 6. Database: EnsureCreated + Seed ────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();

    try
    {
        var db = services.GetRequiredService<AppDbContext>();
        var passwordHasher = services.GetRequiredService<IPasswordHasher<User>>();

        // EnsureCreated creates all tables from the EF Core model if they don't exist.
        // This is provider-agnostic and works with PostgreSQL directly.
        db.Database.EnsureCreated();

        // Seed default Admin user
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

        // Link orphan properties to admin
        var orphanProperties = db.Properties.Where(p => p.UserId == null).ToList();
        if (orphanProperties.Count > 0)
        {
            foreach (var p in orphanProperties)
            {
                p.UserId = adminUser.Id;
                if (string.IsNullOrWhiteSpace(p.SellerName))
                    p.SellerName = $"{adminUser.FirstName} {adminUser.LastName}";
                if (string.IsNullOrWhiteSpace(p.SellerPhone))
                    p.SellerPhone = adminUser.PhoneNumber ?? "0771234567";
            }
            db.SaveChanges();
        }

        // Sanitize: PricePerPerch should only exist for ForSale + Land
        var invalidPerchListings = db.Properties
            .Where(p => (p.ListingType != ListingType.ForSale || p.PropertyType != PropertyType.Land)
                        && p.PricePerPerch != null)
            .ToList();
        if (invalidPerchListings.Count > 0)
        {
            foreach (var item in invalidPerchListings)
                item.PricePerPerch = null;
            db.SaveChanges();
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[DB ERROR]: {ex.Message}");
        logger.LogError(ex, "Database initialization or seeding failed.");
    }
}

app.Run();