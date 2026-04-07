using System;
using System.Collections.Generic;

namespace SourceBase.Application.DTOs
{
    // =============================================
    // GROUP DTOs (Quản lý nhóm)
    // =============================================

    public class ProfileGroupDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int DisplayOrder { get; set; }
        public bool IsActive { get; set; }
    }

    public class CreateProfileGroupDto
    {
        public string Name { get; set; } = string.Empty;
        public int DisplayOrder { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class UpdateProfileGroupDto
    {
        public string Name { get; set; } = string.Empty;
        public int DisplayOrder { get; set; }
        public bool IsActive { get; set; }
    }

    // =============================================
    // FIELD DEFINITION DTOs (Admin quản lý)
    // =============================================

    public class ProfileFieldDefinitionDto
    {
        public Guid Id { get; set; }
        public string Label { get; set; } = string.Empty;
        public string FieldKey { get; set; } = string.Empty;
        public string FieldType { get; set; } = "Text";
        public bool IsRequired { get; set; }
        public int DisplayOrder { get; set; }
        public List<string>? SelectOptions { get; set; }
        public string? Placeholder { get; set; }
        public Guid? GroupId { get; set; }
        public string? GroupName { get; set; } // Hỗ trợ hiển thị tên nhóm nhanh
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class CreateProfileFieldDefinitionDto
    {
        public string Label { get; set; } = string.Empty;
        public string FieldKey { get; set; } = string.Empty;
        public string FieldType { get; set; } = "Text";
        public bool IsRequired { get; set; } = false;
        public int DisplayOrder { get; set; } = 0;
        public List<string>? SelectOptions { get; set; }
        public string? Placeholder { get; set; }
        public Guid? GroupId { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class UpdateProfileFieldDefinitionDto
    {
        public string Label { get; set; } = string.Empty;
        public string FieldType { get; set; } = "Text";
        public bool IsRequired { get; set; }
        public int DisplayOrder { get; set; }
        public List<string>? SelectOptions { get; set; }
        public string? Placeholder { get; set; }
        public Guid? GroupId { get; set; }
        public bool IsActive { get; set; }
    }

    // =============================================
    // FIELD VALUE DTOs (User nhập liệu)
    // =============================================

    public class ProfileFieldValueDto
    {
        public Guid FieldDefinitionId { get; set; }
        public string FieldKey { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public string? Value { get; set; }
    }

    /// <summary>Payload user gửi lên khi lưu nhiều field cùng lúc</summary>
    public class SaveProfileFieldValuesDto
    {
        public List<FieldValuePairDto> Fields { get; set; } = new();
    }

    public class FieldValuePairDto
    {
        public Guid FieldDefinitionId { get; set; }
        public string? Value { get; set; }
    }

    /// <summary>Trả về toàn bộ profile với định nghĩa field và giá trị hiện tại của user</summary>
    public class UserProfileDto
    {
        public Guid UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public List<ProfileFieldWithValueDto> CustomFields { get; set; } = new();
    }

    /// <summary>Trả về profile theo cấu trúc nhóm để UI hiển thị dễ hơn</summary>
    public class UserProfileGroupedDto
    {
        public Guid UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public List<ProfileGroupWithFieldsDto> Groups { get; set; } = new();
    }

    public class ProfileGroupWithFieldsDto
    {
        public Guid? GroupId { get; set; }
        public string GroupName { get; set; } = "Thông Tin Khác";
        public int DisplayOrder { get; set; }
        public List<ProfileFieldWithValueDto> Fields { get; set; } = new();
    }

    public class ProfileFieldWithValueDto
    {
        public Guid FieldDefinitionId { get; set; }
        public string Label { get; set; } = string.Empty;
        public string FieldKey { get; set; } = string.Empty;
        public string FieldType { get; set; } = "Text";
        public bool IsRequired { get; set; }
        public int DisplayOrder { get; set; }
        public List<string>? SelectOptions { get; set; }
        public string? Placeholder { get; set; }
        public Guid? GroupId { get; set; }
        public string? GroupName { get; set; }
        public string? Value { get; set; }
    }
}
