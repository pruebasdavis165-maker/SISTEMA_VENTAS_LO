import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../models/ticket_model.dart';
import '../../providers/printer_provider.dart';
import '../../core/network/api_client.dart';
import '../../core/constants/api_constants.dart';
import '../../core/theme/app_theme.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  List<TicketModel> _boletos = [];
  bool _isLoading = true;
  Timer? _ticker;
  final ApiClient _api = ApiClient();

  @override
  void initState() {
    super.initState();
    _fetchBoletos();
    _ticker = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _ticker?.cancel();
    super.dispose();
  }

  Future<void> _fetchBoletos() async {
    setState(() => _isLoading = true);
    try {
      final res = await _api.dio.get(ApiConstants.boletosHistorial);
      if (res.statusCode == 200) {
        final List<dynamic> data = res.data;
        _boletos = data.map((json) => TicketModel.fromJson(json)).toList();
      }
    } catch (_) {
      // Mock data para desarrollo si aún no hay boletos emitidos en este turno
      if (_boletos.isEmpty) {
        _boletos = [];
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleAnular(TicketModel ticket) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Confirmar Anulación'),
        content: Text('¿Deseas anular el boleto #${ticket.numeroBoleto}? Esta acción no se puede revertir.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger),
            child: const Text('Anular Boleto'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    try {
      final res = await _api.dio.post('${ApiConstants.anularBoleto}/${ticket.id}/anular');
      if (res.statusCode == 200 && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Boleto #${ticket.numeroBoleto} anulado exitosamente.')),
        );
        _fetchBoletos();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('No se pudo anular el boleto o expiró el límite de 5 minutos.')),
        );
      }
    }
  }

  Future<void> _handleReimprimir(TicketModel ticket) async {
    final printer = Provider.of<PrinterProvider>(context, listen: false);
    try {
      await _api.dio.post('${ApiConstants.reimprimirBoleto}/${ticket.id}/reimprimir');
    } catch (_) {}

    final copias = ticket.cantidadReimpresiones + 1;
    final ticketActualizado = TicketModel(
      id: ticket.id,
      numeroBoleto: ticket.numeroBoleto,
      sorteoId: ticket.sorteoId,
      sorteoCodigo: ticket.sorteoCodigo,
      vendedorNombre: ticket.vendedorNombre,
      zonaNombre: ticket.zonaNombre,
      totalVenta: ticket.totalVenta,
      fechaEmision: ticket.fechaEmision,
      estado: ticket.estado,
      cantidadReimpresiones: copias,
      hashSeguridad: ticket.hashSeguridad,
      jugadas: ticket.jugadas,
    );

    final ok = await printer.printTicket(ticketActualizado, esReimpresion: true);
    if (!ok && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Impresora no disponible.')),
      );
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Reimprimiendo COPIA $copias del boleto #${ticket.numeroBoleto}')),
      );
      _fetchBoletos();
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Historial de Boletos'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _boletos.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.receipt_long_outlined, size: 54, color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted),
                      const SizedBox(height: 12),
                      Text(
                        'No hay boletos emitidos en este turno',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                        ),
                      ),
                    ],
                  ),
                )
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: _boletos.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final ticket = _boletos[index];
                    final fechaStr = DateFormat('hh:mm a').format(ticket.fechaEmision);
                    final esAnulable = ticket.esAnulable;
                    final segundos = ticket.segundosRestantesAnulacion;

                    return Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: isDark ? AppColors.darkCard : AppColors.lightCard,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                '#${ticket.numeroBoleto}',
                                style: const TextStyle(fontWeight: FontWeight.black, fontSize: 16, fontFamily: 'monospace'),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: ticket.estado == 'EMITIDO'
                                      ? AppColors.success.withOpacity(0.15)
                                      : AppColors.danger.withOpacity(0.15),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  ticket.estado,
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    color: ticket.estado == 'EMITIDO' ? AppColors.success : AppColors.danger,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Hora: $fechaStr', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                              Text(
                                'Total: C\$ ${ticket.totalVenta.toStringAsFixed(0)}',
                                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.black),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'Jugadas: ${ticket.jugadas.map((j) => "${j.numero} (C\$${j.monto.toStringAsFixed(0)})").join(", ")}',
                            style: TextStyle(fontSize: 12, color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const Divider(height: 20),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              // Botón Anular con Regla de los 5 Minutos
                              if (ticket.estado == 'EMITIDO')
                                ElevatedButton.icon(
                                  onPressed: esAnulable ? () => _handleAnular(ticket) : null,
                                  icon: const Icon(Icons.cancel_outlined, size: 16),
                                  label: Text(
                                    esAnulable ? 'Anular (${segundos}s)' : 'Bloqueado (+5m)',
                                    style: const TextStyle(fontSize: 11),
                                  ),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppColors.danger,
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                  ),
                                )
                              else
                                const SizedBox.shrink(),

                              // Botón Reimprimir
                              OutlinedButton.icon(
                                onPressed: () => _handleReimprimir(ticket),
                                icon: const Icon(Icons.print, size: 16),
                                label: Text(
                                  ticket.cantidadReimpresiones > 0
                                      ? 'Reimprimir (Copia ${ticket.cantidadReimpresiones})'
                                      : 'Reimprimir',
                                  style: const TextStyle(fontSize: 11),
                                ),
                                style: OutlinedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    );
                  },
                ),
    );
  }
}
