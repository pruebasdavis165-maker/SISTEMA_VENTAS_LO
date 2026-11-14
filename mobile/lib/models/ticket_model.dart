import 'jugada_model.dart';

class TicketModel {
  final String id;
  final String numeroBoleto;
  final int sorteoId;
  final String sorteoCodigo;
  final String vendedorNombre;
  final String zonaNombre;
  final double totalVenta;
  final DateTime fechaEmision;
  final String estado; // EMITIDO, ANULADO, PREMIADO
  final int cantidadReimpresiones;
  final String hashSeguridad;
  final List<JugadaModel> jugadas;

  TicketModel({
    required this.id,
    required this.numeroBoleto,
    required this.sorteoId,
    required this.sorteoCodigo,
    required this.vendedorNombre,
    required this.zonaNombre,
    required this.totalVenta,
    required this.fechaEmision,
    required this.estado,
    required this.cantidadReimpresiones,
    required this.hashSeguridad,
    required this.jugadas,
  });

  factory TicketModel.fromJson(Map<String, dynamic> json) {
    return TicketModel(
      id: json['id']?.toString() ?? '',
      numeroBoleto: json['numeroBoleto'] ?? json['codigo'] ?? '',
      sorteoId: json['sorteoId'] as int? ?? 0,
      sorteoCodigo: json['sorteoCodigo'] ?? '',
      vendedorNombre: json['vendedorNombre'] ?? '',
      zonaNombre: json['zonaNombre'] ?? '',
      totalVenta: (json['totalVenta'] as num?)?.toDouble() ?? 0.0,
      fechaEmision: DateTime.tryParse(json['fechaEmision'] ?? json['createdAt'] ?? '') ?? DateTime.now(),
      estado: json['estado'] ?? 'EMITIDO',
      cantidadReimpresiones: (json['cantidadReimpresiones'] as num?)?.toInt() ?? 0,
      hashSeguridad: json['hashSeguridad'] ?? '',
      jugadas: (json['jugadas'] as List<dynamic>?)
              ?.map((j) => JugadaModel.fromJson(j as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }

  // Regla de negocio de los 5 minutos para anulación
  bool get esAnulable {
    if (estado != 'EMITIDO') return false;
    final diferencia = DateTime.now().difference(fechaEmision);
    return diferencia.inMinutes < 5;
  }

  int get segundosRestantesAnulacion {
    final diferencia = DateTime.now().difference(fechaEmision);
    final restantes = 300 - diferencia.inSeconds;
    return restantes > 0 ? restantes : 0;
  }
}
