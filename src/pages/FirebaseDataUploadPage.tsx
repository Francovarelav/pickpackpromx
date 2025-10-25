/**
 * Página para administrar la carga de datos a Firebase
 * Permite subir proveedores y productos desde la interfaz
 */

import { FirebaseDataUploaderButton } from '@/components/firebase-data-uploader-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function FirebaseDataUploadPage() {
  return (
    <div className="container-page-with-padding">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Carga de Datos a Firebase
          </h1>
          <p className="text-muted-foreground">
            Sube los datos de proveedores y productos a la base de datos de Firebase Firestore
          </p>
        </div>

        <Separator />

        {/* Información */}
        <Card>
          <CardHeader>
            <CardTitle>📦 Datos a Cargar</CardTitle>
            <CardDescription>
              Esta operación subirá todos los proveedores y productos a Firebase
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Proveedores</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 14 marcas diferentes</li>
                  <li>• Información de empresa propietaria</li>
                  <li>• País de origen</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Productos</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 22 productos únicos</li>
                  <li>• Información de presentación</li>
                  <li>• Cantidades de restock automáticas</li>
                  <li>• Leadtime calculado por tipo</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Características */}
        <Card>
          <CardHeader>
            <CardTitle>✨ Características</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <div>
                  <p className="font-medium text-sm">Prevención de duplicados</p>
                  <p className="text-xs text-muted-foreground">
                    No crea registros duplicados si ya existen
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <div>
                  <p className="font-medium text-sm">IDs automáticos</p>
                  <p className="text-xs text-muted-foreground">
                    Genera identificadores únicos normalizados
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <div>
                  <p className="font-medium text-sm">Valores inteligentes</p>
                  <p className="text-xs text-muted-foreground">
                    Asigna restock y leadtime según tipo de producto
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <div>
                  <p className="font-medium text-sm">Relaciones automáticas</p>
                  <p className="text-xs text-muted-foreground">
                    Vincula productos con sus proveedores
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botón de carga */}
        <Card>
          <CardHeader>
            <CardTitle>🚀 Ejecutar Carga</CardTitle>
            <CardDescription>
              Haz clic en el botón para iniciar la carga de datos. Puedes ver el progreso en la consola del navegador.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <FirebaseDataUploaderButton />
          </CardContent>
        </Card>

        {/* Advertencia */}
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardHeader>
            <CardTitle className="text-yellow-600 dark:text-yellow-500">
              ⚠️ Importante
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              • Asegúrate de tener configuradas las variables de entorno de Firebase en tu archivo <code className="bg-muted px-1 py-0.5 rounded">.env</code>
            </p>
            <p>
              • Esta operación es <strong>idempotente</strong>: puedes ejecutarla múltiples veces sin crear duplicados
            </p>
            <p>
              • Los datos se cargarán en las colecciones <code className="bg-muted px-1 py-0.5 rounded">suppliers</code> y <code className="bg-muted px-1 py-0.5 rounded">products</code>
            </p>
            <p>
              • Abre la consola del navegador (F12) para ver logs detallados del proceso
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

