class PrinterDeviceModel {
  final String name;
  final String address;
  final bool isConnected;

  PrinterDeviceModel({
    required this.name,
    required this.address,
    this.isConnected = false,
  });
}
