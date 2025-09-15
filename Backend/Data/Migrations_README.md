# Database Migration Setup

1. Install EF Core CLI if not already installed:
   dotnet tool install --global dotnet-ef

2. Add a migration:
   dotnet ef migrations add InitialCreate --project Backend/Backend.csproj --startup-project Backend/Backend.csproj

3. Update the database:
   dotnet ef database update --project Backend/Backend.csproj --startup-project Backend/Backend.csproj

4. Connection string: Set in appsettings.json (PostgreSQL)

5. Seed data: Use Backend/Seeders/SeedData.cs
