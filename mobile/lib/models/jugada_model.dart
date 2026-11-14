class JugadaModel {
  final String numero; // "00" a "99"
  final double monto;
  final double premioPotencial;

  JugadaModel({
    required this.numero,
    required this.monto,
    required this.premioPotencial,
  });

  Map<String, dynamic> toJson() {
    return {
      'numero': numero,
      'monto': monto,
    };
  }

  factory JugadaModel.fromJson(Map<String, dynamic> json) {
    return JugadaModel(
      numero: json['numero'] ?? '',
      monto: (json['monto'] as num?)?.toDouble() ?? 0.0,
      premioPotencial: (json['premioPotencial'] as num?)?.toDouble() ?? 0.0,
    );
  }
}
