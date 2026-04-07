using System;
using SourceBase.Domain.Common;

namespace SourceBase.Domain.Entities
{
    /// <summary>
    /// Giá trị người dùng nhập vào cho một field tùy chỉnh
    /// </summary>
    public class UserProfileFieldValue : BaseEntity
    {
        public Guid UserId { get; set; }
        public ApplicationUser User { get; set; } = null!;

        public Guid FieldDefinitionId { get; set; }
        public UserProfileFieldDefinition FieldDefinition { get; set; } = null!;

        /// <summary>
        /// Giá trị được lưu dạng string (format tùy theo FieldType, FE/BE tự parse)
        /// </summary>
        public string? Value { get; set; }
    }
}
