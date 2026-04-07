using System.Threading;
using System.Threading.Tasks;

namespace SourceBase.Application.Interfaces
{
    public interface IApplicationDbContext
    {
        // Example: DbSet<User> Users { get; }
        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    }
}
