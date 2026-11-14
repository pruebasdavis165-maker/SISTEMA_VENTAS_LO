import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/sorteo_provider.dart';
import '../../providers/pos_provider.dart';
import '../../core/theme/app_theme.dart';
import 'ticket_success_screen.dart';

class PosScreen extends StatefulWidget {
  const PosScreen({super.key});

  @override
  State<PosScreen> createState() => _PosScreenState();
}

class _PosScreenState extends State<PosScreen> {
  final List<double> _montosRapidos = [10.0, 20.0, 50.0, 100.0, 200.0];

  void _handleAgregarJugada() {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final pos = Provider.of<PosProvider>(context, listen: false);
    final coef = auth.user?.coeficientePremio ?? 80.0;

    final ok = pos.agregarJugada(coeficiente: coef);
    if (!ok) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Ingresa un número (00-99) y un monto válido.'),
          duration: Duration(seconds: 1),
        ),
      );
    }
  }

  Future<void> _handleEmitirBoleto() async {
    final pos = Provider.of<PosProvider>(context, listen: false);
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final sorteo = Provider.of<SorteoProvider>(context, listen: false);

    if (sorteo.sorteoSeleccionado == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No hay sorteo activo seleccionado.')),
      );
      return;
    }

    final success = await pos.emitirBoleto(
      sorteoId: sorteo.sorteoSeleccionado!.id,
      vendedorId: auth.user?.id ?? '',
    );

    if (success && mounted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => TicketSuccessScreen(ticket: pos.ultimoBoletoEmitido!),
        ),
      );
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(pos.errorMessage ?? 'Error al emitir boleto.'),
          backgroundColor: AppColors.danger,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final auth = Provider.of<AuthProvider>(context);
    final pos = Provider.of<PosProvider>(context);
    final sorteo = Provider.of<SorteoProvider>(context);

    final coef = auth.user?.coeficientePremio ?? 80.0;
    final premioEnVivo = (pos.montoActual * coef).toStringAsFixed(0);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          sorteo.sorteoSeleccionado?.cleanNombre ?? 'Punto de Venta',
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        actions: [
          if (pos.carrito.isNotEmpty)
            TextButton.icon(
              onPressed: () => pos.limpiarCarrito(),
              icon: const Icon(Icons.delete_sweep, size: 18, color: AppColors.danger),
              label: const Text('Limpiar', style: TextStyle(color: AppColors.danger, fontSize: 12)),
            ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // 1. Selector de Turno Rápido
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              color: isDark ? AppColors.darkCard : Colors.grey.shade100,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.schedule, size: 16, color: AppColors.primary),
                      const SizedBox(width: 6),
                      Text(
                        'Cierre: ${sorteo.sorteoSeleccionado?.displayHora ?? "--"}',
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                  Text(
                    'Multiplicador: x${coef.toStringAsFixed(0)}',
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.accent),
                  ),
                ],
              ),
            ),

            // 2. Visor del Número & Monto Actual
            Container(
              padding: const EdgeInsets.all(12),
              margin: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkCard : AppColors.lightCard,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
              ),
              child: Row(
                children: [
                  // Caja de Número en Cyan Sólido
                  Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      color: AppColors.accent,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.black, width: 2),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      pos.numeroActual.isEmpty ? '--' : pos.numeroActual.padLeft(2, '0'),
                      style: const TextStyle(
                        color: Colors.black,
                        fontSize: 28,
                        fontWeight: FontWeight.black,
                        fontFamily: 'monospace',
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),

                  // Detalle de Apuesta y Premio
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Apuesta: C\$ ${pos.montoActual.toStringAsFixed(0)}',
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Premio Potencial: C\$ $premioEnVivo',
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: AppColors.success,
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Botón Agregar Jugada
                  ElevatedButton(
                    onPressed: pos.numeroActual.isNotEmpty ? _handleAgregarJugada : null,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Agregar'),
                  ),
                ],
              ),
            ),

            // 3. Montos Rápidos (Pills)
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Row(
                children: _montosRapidos.map((monto) {
                  final isSelected = pos.montoActual == monto;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text('C\$ ${monto.toStringAsFixed(0)}'),
                      selected: isSelected,
                      selectedColor: AppColors.primary,
                      labelStyle: TextStyle(
                        color: isSelected ? Colors.white : (isDark ? AppColors.darkText : AppColors.lightText),
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                      onSelected: (_) => pos.setMonto(monto),
                    ),
                  );
                }).toList(),
              ),
            ),

            const SizedBox(height: 8),

            // 4. Carrito / Lista de Jugadas (Expandible)
            Expanded(
              child: pos.carrito.isEmpty
                  ? Center(
                      child: Text(
                        'Usa el teclado para marcar números (00-99)',
                        style: TextStyle(
                          color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                          fontSize: 13,
                        ),
                      ),
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      itemCount: pos.carrito.length,
                      separatorBuilder: (_, __) => const Divider(height: 1),
                      itemBuilder: (context, index) {
                        final j = pos.carrito[index];
                        return ListTile(
                          dense: true,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 8),
                          leading: Container(
                            width: 38,
                            height: 38,
                            decoration: BoxDecoration(
                              color: AppColors.accent,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: Colors.black, width: 1.5),
                            ),
                            alignment: Alignment.center,
                            child: Text(
                              j.numero,
                              style: const TextStyle(
                                color: Colors.black,
                                fontWeight: FontWeight.black,
                                fontSize: 16,
                                fontFamily: 'monospace',
                              ),
                            ),
                          ),
                          title: Text(
                            'C\$ ${j.monto.toStringAsFixed(0)}',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                          ),
                          subtitle: Text(
                            'Premio: C\$ ${j.premioPotencial.toStringAsFixed(0)}',
                            style: const TextStyle(color: AppColors.success, fontSize: 11),
                          ),
                          trailing: IconButton(
                            icon: const Icon(Icons.close, size: 18, color: Colors.grey),
                            onPressed: () => pos.eliminarJugada(index),
                          ),
                        );
                      },
                    ),
            ),

            // 5. Teclado Numérico a una mano (Grid 4x3)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkCard : Colors.grey.shade200,
                border: Border(
                  top: BorderSide(color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
                ),
              ),
              child: Column(
                children: [
                  _buildKeypadRow(['1', '2', '3']),
                  const SizedBox(height: 6),
                  _buildKeypadRow(['4', '5', '6']),
                  const SizedBox(height: 6),
                  _buildKeypadRow(['7', '8', '9']),
                  const SizedBox(height: 6),
                  _buildKeypadBottomRow(pos),
                ],
              ),
            ),

            // 6. Barra de Emisión de Boleto
            Container(
              padding: const EdgeInsets.all(12),
              color: isDark ? AppColors.darkBg : Colors.white,
              child: ElevatedButton(
                onPressed: pos.carrito.isNotEmpty && !pos.isSubmitting ? _handleEmitirBoleto : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.success,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                child: pos.isSubmitting
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white),
                      )
                    : Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.check_circle_outline, size: 20),
                          const SizedBox(width: 8),
                          Text(
                            'EMITIR BOLETO • C\$ ${pos.totalVenta.toStringAsFixed(0)} (${pos.totalJugadas})',
                            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.black),
                          ),
                        ],
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildKeypadRow(List<String> digits) {
    return Row(
      children: digits.map((d) {
        return Expanded(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 3),
            child: _buildKeypadButton(
              label: d,
              onTap: () => Provider.of<PosProvider>(context, listen: false).appendDigit(d),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildKeypadBottomRow(PosProvider pos) {
    return Row(
      children: [
        // Botón C (Limpiar)
        Expanded(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 3),
            child: _buildKeypadButton(
              label: 'C',
              color: AppColors.danger.withOpacity(0.15),
              textColor: AppColors.danger,
              onTap: () => pos.clearNumero(),
            ),
          ),
        ),
        // Dígito 0
        Expanded(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 3),
            child: _buildKeypadButton(
              label: '0',
              onTap: () => pos.appendDigit('0'),
            ),
          ),
        ),
        // Botón Borrar (Backspace)
        Expanded(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 3),
            child: _buildKeypadButton(
              icon: Icons.backspace_outlined,
              onTap: () => pos.backspace(),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildKeypadButton({
    String? label,
    IconData? icon,
    VoidCallback? onTap,
    Color? color,
    Color? textColor,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Material(
      color: color ?? (isDark ? AppColors.darkBg : Colors.white),
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Container(
          height: 48,
          alignment: Alignment.center,
          child: icon != null
              ? Icon(icon, size: 20, color: isDark ? AppColors.darkText : AppColors.lightText)
              : Text(
                  label ?? '',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.black,
                    color: textColor ?? (isDark ? AppColors.darkText : AppColors.lightText),
                    fontFamily: 'monospace',
                  ),
                ),
        ),
      ),
    );
  }
}
