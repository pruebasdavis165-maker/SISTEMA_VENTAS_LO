using System;

namespace SistemaVentasLO.Domain.Common;

public static class NicaraguaDateTime
{
    // Nicaragua se rige por UTC-6 (sin horario de verano)
    public static readonly TimeSpan UtcOffset = TimeSpan.FromHours(-6);

    public static DateTime Now => DateTime.UtcNow.Add(UtcOffset);

    public static DateOnly Today => DateOnly.FromDateTime(Now);

    public static DateTime ToUtc(DateOnly fecha, TimeSpan horaLocal)
    {
        // 11:00 AM Nicaragua (UTC-6) -> 17:00 UTC (+6 horas)
        var localDateTime = fecha.ToDateTime(TimeOnly.FromTimeSpan(horaLocal), DateTimeKind.Unspecified);
        return DateTime.SpecifyKind(localDateTime.Subtract(UtcOffset), DateTimeKind.Utc);
    }

    public static DateTime ToNicaraguaLocal(DateTime utcDateTime)
    {
        var local = utcDateTime.Add(UtcOffset);
        return DateTime.SpecifyKind(local, DateTimeKind.Unspecified);
    }
}
