using Microsoft.AspNetCore.Authorization;

namespace Backend.Authorization
{
    // Marker requirement used by CompanyScoped policy
    public class CompanyScopeRequirement : IAuthorizationRequirement { }
}
