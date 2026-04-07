using Microsoft.AspNetCore.Mvc;

namespace SourceBase.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public abstract class BaseApiController : ControllerBase
    {
        // Các tính năng dùng chung cho Controller có thể đặt ở đây
    }
}
