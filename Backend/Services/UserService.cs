using Microsoft.AspNetCore.Identity;
using Backend.Models;
using Backend.Data;
using System.Linq;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services
{
    public class UserService
    {
        private readonly UserManager<IdentityUser> _userManager;
        private readonly AppDbContext _context;

        public UserService(UserManager<IdentityUser> userManager, AppDbContext context)
        {
            _userManager = userManager;
            _context = context;
        }

        public async Task<IdentityResult> CreateUserAsync(string email, string password, string role, int companyId)
        {
            var user = new IdentityUser { UserName = email, Email = email };
            var result = await _userManager.CreateAsync(user, password);

            if (result.Succeeded)
            {
                await _userManager.AddToRoleAsync(user, role);
                
                var userProfile = new User
                {
                    Id = user.Id,
                    Email = email,
                    Role = role,
                    CompanyId = companyId,
                    IsActive = true, // Ensure new users are active
                    CreatedAt = DateTime.UtcNow
                };

                _context.UserProfiles.Add(userProfile);
                await _context.SaveChangesAsync();
            }

            return result;
        }

        public async Task<User?> GetUserProfileAsync(string userId)
        {
            return await _context.UserProfiles.FindAsync(userId);
        }

        public async Task<User?> GetActiveUserByEmailAsync(string email)
        {
            return await _context.UserProfiles
                .Where(u => u.Email == email && u.IsActive)
                .FirstOrDefaultAsync();
        }
    }
}
