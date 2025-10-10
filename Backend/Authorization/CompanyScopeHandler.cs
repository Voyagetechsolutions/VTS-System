using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;

namespace Backend.Authorization
{
    public class CompanyScopeHandler : AuthorizationHandler<CompanyScopeRequirement>
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CompanyScopeHandler(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, CompanyScopeRequirement requirement)
        {
            var userCompanyIdClaim = context.User?.FindFirst("companyId")?.Value;
            if (string.IsNullOrEmpty(userCompanyIdClaim))
            {
                return Task.CompletedTask; // no claim, fail silently
            }

            var http = _httpContextAccessor.HttpContext;

            if (!int.TryParse(userCompanyIdClaim, out var userCompanyId))
            {
                return Task.CompletedTask; // invalid claim
            }

            int? targetCompanyId = null;

            try
            {
                // Route values
                if (http?.Request?.RouteValues != null)
                {
                    if (http.Request.RouteValues.TryGetValue("companyId", out var routeCompanyObj))
                    {
                        if (routeCompanyObj != null && int.TryParse(routeCompanyObj.ToString(), out var routeCompanyId))
                        {
                            targetCompanyId = routeCompanyId;
                        }
                    }
                    else if (http.Request.RouteValues.TryGetValue("id", out var idObj))
                    {
                        // Some endpoints might use {id} to mean company id
                        if (idObj != null && int.TryParse(idObj.ToString(), out var idAsInt))
                        {
                            targetCompanyId = idAsInt;
                        }
                    }
                }

                // Query string fallback
                if (targetCompanyId == null && http?.Request?.Query != null && http.Request.Query.TryGetValue("companyId", out var qv))
                {
                    if (int.TryParse(qv.ToString(), out var qCompanyId))
                    {
                        targetCompanyId = qCompanyId;
                    }
                }

                // Header fallback: X-Company-Id
                if (targetCompanyId == null && http?.Request?.Headers != null && http.Request.Headers.TryGetValue("X-Company-Id", out var hv))
                {
                    if (int.TryParse(hv.ToString(), out var hCompanyId))
                    {
                        targetCompanyId = hCompanyId;
                    }
                }
            }
            catch
            {
                // ignore parsing errors
            }

            var method = http?.Request?.Method?.ToUpperInvariant() ?? "GET";

            // Write methods require explicit company target and strict equality
            var isWrite = method == "POST" || method == "PUT" || method == "PATCH" || method == "DELETE";

            if (isWrite)
            {
                if (targetCompanyId == null)
                {
                    return Task.CompletedTask; // fail: write without explicit company scope
                }

                if (targetCompanyId.Value == userCompanyId)
                {
                    context.Succeed(requirement);
                }

                return Task.CompletedTask;
            }

            // For read methods, allow if no explicit target specified, else enforce match when present
            if (targetCompanyId == null || targetCompanyId.Value == userCompanyId)
            {
                context.Succeed(requirement);
            }

            return Task.CompletedTask;
        }
    }
}
