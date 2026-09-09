using Microsoft.EntityFrameworkCore;
using RealEstate.Api.Data;
using RealEstate.Api.Models;

var builder = WebApplication.CreateBuilder(args);

// Register SQLite Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// CORS Configuration
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
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
app.UseAuthorization();
app.MapControllers();

// Ensure PricePerPerch is strictly null for non-Land or non-ForSale properties
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
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