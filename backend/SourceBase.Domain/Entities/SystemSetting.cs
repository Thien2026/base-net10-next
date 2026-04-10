using System;
using SourceBase.Domain.Common;

namespace SourceBase.Domain.Entities
{
    public class SystemSetting : BaseEntity
    {
        public string Key { get; set; } = string.Empty;
        public string? Value { get; set; }
    }
}
