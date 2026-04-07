using System;
using System.Collections.Generic;
using SourceBase.Domain.Common;

namespace SourceBase.Domain.Entities
{
    /// <summary>
    /// Kiểu dữ liệu của một field (Admin cấu hình)
    /// </summary>
    public enum ProfileFieldType
    {
        Text = 0,       // Chuỗi văn bản tự do
        Number = 1,     // Số
        Date = 2,       // Ngày tháng
        Boolean = 3,    // Có/Không
        Select = 4,     // Danh sách lựa chọn (selectbox)
        Textarea = 5    // Văn bản nhiều dòng
    }

    /// <summary>
    /// Định nghĩa một trường thông tin người dùng tùy chỉnh (Admin tạo ra)
    /// </summary>
    public class UserProfileFieldDefinition : BaseEntity
    {
        /// <summary>Tên hiển thị của trường (ví dụ: "Ngày sinh", "Phòng ban")</summary>
        public string Label { get; set; } = string.Empty;

        /// <summary>Tên key nội bộ, unique (ví dụ: "date_of_birth", "department")</summary>
        public string FieldKey { get; set; } = string.Empty;

        /// <summary>Kiểu dữ liệu của trường</summary>
        public ProfileFieldType FieldType { get; set; } = ProfileFieldType.Text;

        /// <summary>Trường này có bắt buộc không?</summary>
        public bool IsRequired { get; set; } = false;

        /// <summary>Thứ tự hiển thị (tăng dần)</summary>
        public int DisplayOrder { get; set; } = 0;

        /// <summary>
        /// Dành cho kiểu Select: JSON array of strings, ví dụ: ["Kỹ thuật","Kinh doanh","HR"]
        /// </summary>
        public string? SelectOptions { get; set; }

        /// <summary>Gợi ý/placeholder hiển thị cho người dùng</summary>
        public string? Placeholder { get; set; }

        /// <summary>Nhóm để phân loại field trên UI (VD: Personal, Work)</summary>
        public Guid? GroupId { get; set; }
    public virtual UserProfileGroup? Group { get; set; }

        /// <summary>Field này có đang được kích hoạt không?</summary>
        public bool IsActive { get; set; } = true;

        // Navigation
        public ICollection<UserProfileFieldValue> Values { get; set; } = new List<UserProfileFieldValue>();
    }
}
