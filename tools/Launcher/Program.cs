using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Threading;

namespace SistemaVentasLO.Launcher;

class Program
{
    static void Main(string[] args)
    {
        Console.Title = "SISTEMA VENTAS LO - Lanzador de Sistema";
        Console.Clear();
        Console.ForegroundColor = ConsoleColor.Cyan;
        Console.WriteLine("==========================================================");
        Console.WriteLine("                  SISTEMA VENTAS LO                       ");
        Console.WriteLine("        Lanzador Oficial y Monitor de Servicios           ");
        Console.WriteLine("==========================================================");
        Console.ResetColor();
        Console.WriteLine();

        Console.WriteLine("[INFO] Iniciando servicios de backend, frontend y base de datos...");
        
        var proc = new Process
        {
            StartInfo = new ProcessStartInfo
            {
                FileName = "docker",
                Arguments = "compose up -d --build",
                UseShellExecute = false,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                CreateNoWindow = false
            }
        };

        try
        {
            proc.Start();
            while (!proc.StandardOutput.EndOfStream)
            {
                string? line = proc.StandardOutput.ReadLine();
                if (line != null) Console.WriteLine("  " + line);
            }
            proc.WaitForExit();

            if (proc.ExitCode == 0)
            {
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine("\n[EXITO] Todos los servicios se han iniciado y estan saludables.");
                Console.ResetColor();

                Console.WriteLine("\nAbriendo navegador en la plataforma web...");
                Thread.Sleep(2000);
                OpenBrowser("http://localhost:3000");

                Console.WriteLine("\n----------------------------------------------------------");
                Console.WriteLine("  Plataforma Web (Frontend):  http://localhost:3000");
                Console.WriteLine("  API REST & Swagger:         http://localhost:5000/swagger");
                Console.WriteLine("  Base de Datos PostgreSQL:   localhost:5432 (ventas_lo_db)");
                Console.WriteLine("----------------------------------------------------------");
            }
            else
            {
                string error = proc.StandardError.ReadToEnd();
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine("\n[ERROR] No se pudo iniciar con Docker Compose:");
                Console.WriteLine(error);
                Console.WriteLine("\nVerifica que Docker Desktop este abierto y ejecutandose.");
                Console.ResetColor();
            }
        }
        catch (Exception ex)
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine($"\n[ERROR] Fallo al ejecutar Docker: {ex.Message}");
            Console.WriteLine("Asegurate de tener Docker instalado en el PATH del sistema.");
            Console.ResetColor();
        }

        Console.WriteLine("\nPresiona cualquier tecla para cerrar esta ventana...");
        Console.ReadKey();
    }

    static void OpenBrowser(string url)
    {
        try
        {
            if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
            {
                Process.Start(new ProcessStartInfo("cmd", $"/c start {url.Replace("&", "^&")}") { CreateNoWindow = true });
            }
            else if (RuntimeInformation.IsOSPlatform(OSPlatform.Linux))
            {
                Process.Start("xdg-open", url);
            }
            else if (RuntimeInformation.IsOSPlatform(OSPlatform.OSX))
            {
                Process.Start("open", url);
            }
        }
        catch
        {
            // Ignorar fallo de apertura de navegador
        }
    }
}
