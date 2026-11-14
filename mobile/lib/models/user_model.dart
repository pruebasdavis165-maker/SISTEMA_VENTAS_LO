class UserModel {
  final String id;
  final String username;
  final String nombreCompleto;
  final String cedula;
  final String rol;
  final int? zonaId;
  final String? zonaNombre;
  final double coeficientePremio;
  final double porcentajeComision;

  UserModel({
    required this.id,
    required this.username,
    required this.nombreCompleto,
    required this.cedula,
    required this.rol,
    this.zonaId,
    this.zonaNombre,
    required this.coeficientePremio,
    required this.porcentajeComision,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id']?.toString() ?? '',
      username: json['username'] ?? json['userName'] ?? '',
      nombreCompleto: json['nombreCompleto'] ?? json['name'] ?? '',
      cedula: json['cedula'] ?? '',
      rol: json['rol'] ?? json['role'] ?? 'VENDEDOR',
      zonaId: json['zonaId'],
      zonaNombre: json['zonaNombre'],
      coeficientePremio: (json['coeficientePremio'] as num?)?.toDouble() ?? 80.0,
      porcentajeComision: (json['porcentajeComision'] as num?)?.toDouble() ?? 10.0,
    );
  }
}
