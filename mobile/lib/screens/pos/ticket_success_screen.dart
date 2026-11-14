import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../models/ticket_model.dart';
import '../../providers/printer_provider.dart';
import '../../core/theme/app_theme.dart';
import 'pos_screen.dart';

class TicketSuccessScreen extends StatefulWidget {
  final TicketModel ticket;

  const TicketSuccessScreen({super.key, required this.ticket});

  @override
  State<TicketSuccessScreen> createState() => _TicketSuccessScreenState();
}

class _TicketSuccessScreenState extends State<TicketSuccessScreen> {
  @override
  void initState() {
    super.initState();
    // Intento de auto-impresión inmediata
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final printer = Provider.of<PrinterProvider>(context, listen: false);
      if (printer.isConnected) {
        printer.printTicket(widget.ticket);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final printer = Provider.of<PrinterProvider>(context);

    final fechaStr = DateFormat('dd/MM/yyyy hh:mm a').format(widget.ticket.fechaEmision);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Boleto Emitido'),
        automaticallyImplyLeading: false,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Icono de Éxito
              const Center(
                child: Icon(Icons.check_circle, size: 64, color: AppColors.success),
              ),
              const SizedBox(height: 8),
              const Text(
                'Venta Registrada Exitosamente',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.black),
              ),
              const SizedBox(height: 16),

              // Vista Previa del Ticket Térmico
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.grey.shade400, width: 1.5),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    const Text(
                      'VENTAS LO',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.black,
                        color: Colors.black,
                        letterSpacing: 1.5,
                      ),
                    ),
                    const Text(
                      'PLATAFORMA OFICIAL',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.black54),
                    ),
                    const Divider(color: Colors.black45, thickness: 1, height: 20),

                    // Marca de Agua
                    Text(
                      widget.ticket.cantidadReimpresiones > 0
                          ? '*** COPIA ${widget.ticket.cantidadReimpresiones} ***'
                          : '* BOLETO ORIGINAL *',
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Colors.black),
                    ),
                    const Divider(color: Colors.black45, thickness: 1, height: 20),

                    // Datos del Boleto
                    _buildTicketRow('Boleto:', widget.ticket.numeroBoleto),
                    _buildTicketRow('Sorteo:', widget.ticket.sorteoCodigo),
                    _buildTicketRow('Sucursal:', widget.ticket.zonaNombre),
                    _buildTicketRow('Vendedor:', widget.ticket.vendedorNombre),
                    _buildTicketRow('Fecha:', fechaStr),
                    const Divider(color: Colors.black45, thickness: 1, height: 20),

                    // Encabezado de Jugadas
                    const Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('NUM', style: TextStyle(fontWeight: FontWeight.black, fontSize: 12, color: Colors.black)),
                        Text('MONTO', style: TextStyle(fontWeight: FontWeight.black, fontSize: 12, color: Colors.black)),
                        Text('PREMIO', style: TextStyle(fontWeight: FontWeight.black, fontSize: 12, color: Colors.black)),
                      ],
                    ),
                    const SizedBox(height: 6),

                    // Lista de Jugadas
                    ...widget.ticket.jugadas.map((j) {
                      return Padding(
                        padding: const EdgeInsets.symmetric(vertical: 3),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              j.numero,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                                fontFamily: 'monospace',
                                color: Colors.black,
                              ),
                            ),
                            Text(
                              'C\$ ${j.monto.toStringAsFixed(0)}',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.black),
                            ),
                            Text(
                              'C\$ ${j.premioPotencial.toStringAsFixed(0)}',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.black),
                            ),
                          ],
                        ),
                      );
                    }),

                    const Divider(color: Colors.black45, thickness: 1, height: 20),

                    // Total
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'TOTAL:',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.black, color: Colors.black),
                        ),
                        Text(
                          'C\$ ${widget.ticket.totalVenta.toStringAsFixed(2)}',
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.black, color: Colors.black),
                        ),
                      ],
                    ),

                    const SizedBox(height: 14),
                    Text(
                      'Código de Verificación:\n${widget.ticket.hashSeguridad.isEmpty ? "AUTENTICADO" : widget.ticket.hashSeguridad.substring(0, widget.ticket.hashSeguridad.length.clamp(0, 16)).toUpperCase()}',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'monospace',
                        color: Colors.black54,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // Botón de Reimpresión Manual
              ElevatedButton.icon(
                onPressed: printer.isPrinting
                    ? null
                    : () async {
                        final ok = await printer.printTicket(widget.ticket);
                        if (!ok && mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('No hay impresora Bluetooth conectada.')),
                          );
                        }
                      },
                icon: const Icon(Icons.print),
                label: Text(printer.isPrinting ? 'Imprimiendo...' : 'Imprimir Ticket Térmico'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
              ),

              const SizedBox(height: 10),

              // Botón Nueva Venta
              OutlinedButton.icon(
                onPressed: () {
                  Navigator.pushReplacement(
                    context,
                    MaterialPageRoute(builder: (_) => const PosScreen()),
                  );
                },
                icon: const Icon(Icons.add),
                label: const Text('Nueva Venta'),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
              ),

              const SizedBox(height: 10),

              // Volver al Inicio
              TextButton(
                onPressed: () {
                  Navigator.popUntil(context, (route) => route.isFirst);
                },
                child: const Text('Volver al Menú Principal'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTicketRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 11, color: Colors.black54, fontWeight: FontWeight.bold)),
          Text(value, style: const TextStyle(fontSize: 11, color: Colors.black, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}
