namespace SourceBase.Application.DTOs.Files
{
    public class FileItemDto
    {
        public string Name { get; set; } = string.Empty;
        public string Path { get; set; } = string.Empty; // Relative path from root
        public bool IsDirectory { get; set; }
        public long Size { get; set; }
        public DateTime LastModified { get; set; }
        public string Extension { get; set; } = string.Empty;
        public List<FileItemDto>? Children { get; set; } // Used for folder tree
    }

    public class MoveRequestDto
    {
        public List<string> Paths { get; set; } = new List<string>();
        public string DestinationFolder { get; set; } = string.Empty;
    }

    public class RenameRequestDto
    {
        public string Path { get; set; } = string.Empty;
        public string NewName { get; set; } = string.Empty;
    }

    public class DeleteRequestDto
    {
        public List<string> Paths { get; set; } = new List<string>();
    }

    public class CreateFolderRequestDto
    {
        public string Path { get; set; } = string.Empty;
        public string FolderName { get; set; } = string.Empty;
    }

    public class FileUploadDto
    {
        public Stream Content { get; set; } = Stream.Null;
        public string RelativePath { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
    }

    public class StorageStatsDto
    {
        public long TotalSizeBytes { get; set; }
        public int TotalFiles { get; set; }
        public int TotalFolders { get; set; }
        public string TotalSizeFormatted => FormatSize(TotalSizeBytes);

        private static string FormatSize(long bytes)
        {
            if (bytes >= 1_073_741_824) return $"{bytes / 1_073_741_824.0:F2} GB";
            if (bytes >= 1_048_576) return $"{bytes / 1_048_576.0:F2} MB";
            if (bytes >= 1_024) return $"{bytes / 1_024.0:F1} KB";
            return $"{bytes} B";
        }
    }
}

