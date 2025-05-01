export const notifyAdmin = (scan: { userId: string, scanData: string, scanType: string, timestamp: string, zone: string }) => {
    console.log(`¡Notificación para el administrador!`);
    console.log(`Nuevo escaneo realizado por el usuario ${scan.userId}`);
    console.log(`Escaneo realizado en la zona ${scan.zone}`);
    console.log(`Fecha y hora: ${scan.timestamp}`);
    console.log(`Datos del escaneo: ${scan.scanData}`);
  };
  