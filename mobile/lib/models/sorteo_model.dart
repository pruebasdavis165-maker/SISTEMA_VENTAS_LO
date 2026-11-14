class SorteoModel {
  final int id;
  final String codigo;
  final String fecha;
  final DateTime horaCierre;
  final String? horarioNombre;
  final String estado;
  final String? numeroGanador;
  final bool permiteVenta;
  final int minutosRestantesVenta;

  SorteoModel({
    required this.id,
    required this.codigo,
    required this.fecha,
    required this.horaCierre,
    this.horarioNombre,
    required this.estado,
    this.numeroGanador,
    required this.permiteVenta,
    required this.minutosRestantesVenta,
  });

  factory SorteoModel.fromJson(Map<String, dynamic> json) {
    return SorteoModel(
      id: json['id'] as int,
      codigo: json['codigo'] ?? '',
      fecha: json['fecha'] ?? '',
      horaCierre: DateTime.tryParse(json['horaCierre'] ?? '') ?? DateTime.now(),
      horarioNombre: json['horarioNombre'],
      estado: json['estado'] ?? 'ABIERTO',
      numeroGanador: json['numeroGanador'],
      permiteVenta: json['permiteVenta'] as bool? ?? false,
      minutosRestantesVenta: (json['minutosRestantesVenta'] as num?)?.toInt() ?? 0,
    );
  }

  String get cleanNombre {
    if (horarioNombre == null || horarioNombre!.isEmpty) return 'Sorteo Oficial';
    return horarioNombre!.replaceAll(RegExp(r'\s*\([^)]+\)'), '').trim();
  }

  String get displayHora {
    if (horarioNombre != null) {
      final match = RegExp(r'\(([^)]+)\)').firstMatch(horarioNombre!);
      if (match != null) return match.group(1)!;
    }
    final hour = horaCierre.hour > 12 ? horaCierre.hour - 12 : horaCierre.hour;
    final ampm = horaCierre.hour >= 12 ? 'PM' : 'AM';
    final minute = horaCierre.minute.toString().padLeft(2, '0');
    return '$hour:$minute $ampm';
  }
}
