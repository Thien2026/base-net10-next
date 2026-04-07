using SourceBase.Domain.Common;

namespace SourceBase.Domain.Entities
{
    public class UserProfileGroup : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public int DisplayOrder { get; set; }
        public bool IsActive { get; set; } = true;

        // Navigation property
        public virtual ICollection<UserProfileFieldDefinition> Fields { get; set; } = new List<UserProfileFieldDefinition>();
    }
}
