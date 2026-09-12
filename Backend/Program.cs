using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using RealEstate.Api.Data;
using RealEstate.Api.Models;
using RealEstate.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Register SQLite Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

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
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:5174")
              .AllowAnyHeader()
              .AllowAnyMethod();
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
app.UseCors("AllowFrontend");
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Database Migration / Initialization & Data Sanitization
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<User>>();

    // Create database tables if they do not exist (adds Users table, new columns, etc.)
    db.Database.EnsureCreated();

    // Safely ensure Users table exists in SQLite
    db.Database.ExecuteSqlRaw(@"
        CREATE TABLE IF NOT EXISTS Users (
            Id TEXT PRIMARY KEY,
            FirstName TEXT NOT NULL,
            LastName TEXT NOT NULL,
            Email TEXT NOT NULL,
            PasswordHash TEXT NULL,
            PhoneNumber TEXT NULL,
            ProfilePictureUrl TEXT NULL,
            Role TEXT NOT NULL DEFAULT 'User',
            GoogleId TEXT NULL,
            CreatedAt TEXT NOT NULL
        );
        CREATE UNIQUE INDEX IF NOT EXISTS IX_Users_Email ON Users (Email);
    ");

    // Safely ensure new columns exist in existing SQLite databases
    try { db.Database.ExecuteSqlRaw("ALTER TABLE Properties ADD COLUMN UserId TEXT NULL;"); } catch { }
    try { db.Database.ExecuteSqlRaw("ALTER TABLE Properties ADD COLUMN IsSold INTEGER NOT NULL DEFAULT 0;"); } catch { }

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

app.Run();