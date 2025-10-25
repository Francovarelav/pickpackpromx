/**
 * Componente para subir datos a Firebase desde la interfaz
 * Botón que ejecuta la carga de proveedores y productos
 */

import { useState } from 'react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { executeDataUpload } from '../excels/upload-data-to-firebase-script';

export function FirebaseDataUploaderButton() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);

  const handleUpload = async () => {
    setIsUploading(true);
    setUploadComplete(false);

    try {
      toast.info('Iniciando carga de datos a Firebase...', {
        duration: 3000,
      });

      await executeDataUpload();

      setUploadComplete(true);
      toast.success('¡Datos subidos exitosamente a Firebase!', {
        description: 'Todos los proveedores y productos han sido cargados.',
        duration: 5000,
      });
    } catch (error) {
      console.error('Error al subir datos:', error);
      toast.error('Error al subir datos a Firebase', {
        description: error instanceof Error ? error.message : 'Error desconocido',
        duration: 5000,
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Button
        onClick={handleUpload}
        disabled={isUploading || uploadComplete}
        variant={uploadComplete ? 'outline' : 'default'}
        size="lg"
      >
        {isUploading && (
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {isUploading
          ? 'Subiendo datos...'
          : uploadComplete
          ? '✓ Datos subidos'
          : '🔥 Subir datos a Firebase'}
      </Button>

      {uploadComplete && (
        <p className="text-sm text-muted-foreground text-center">
          Los datos han sido cargados exitosamente. Revisa la consola para más detalles.
        </p>
      )}
    </div>
  );
}

