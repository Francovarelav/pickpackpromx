import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft,
  Cube,
  Loader2,
  Monitor,
  Smartphone,
  Tablet
} from 'lucide-react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';

interface Render3DPageProps {
  onBack?: () => void;
}

export default function Render3DPage({ onBack }: Render3DPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<'desktop' | 'mobile' | 'tablet'>('desktop');

  const handleStartRender = () => {
    setIsLoading(true);
    // Simular carga del render 3D
    setTimeout(() => {
      setIsLoading(false);
      console.log('🎮 Render 3D iniciado');
    }, 2000);
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-4 p-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onBack && (
                <Button variant="outline" onClick={onBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </Button>
              )}
              <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                  <Cube className="text-purple-600" />
                  Ver Render 3D
                </h1>
                <p className="text-muted-foreground">
                  Visualización 3D del almacén y productos
                </p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Panel de Control */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    Configuración del Render
                  </CardTitle>
                  <CardDescription>
                    Configura las opciones de visualización 3D
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Selección de Dispositivo */}
                  <div>
                    <h3 className="text-sm font-medium mb-3">Dispositivo de Visualización</h3>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant={selectedDevice === 'desktop' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedDevice('desktop')}
                        className="flex flex-col items-center gap-2 h-auto py-4"
                      >
                        <Monitor className="w-5 h-5" />
                        <span className="text-xs">Desktop</span>
                      </Button>
                      <Button
                        variant={selectedDevice === 'tablet' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedDevice('tablet')}
                        className="flex flex-col items-center gap-2 h-auto py-4"
                      >
                        <Tablet className="w-5 h-5" />
                        <span className="text-xs">Tablet</span>
                      </Button>
                      <Button
                        variant={selectedDevice === 'mobile' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedDevice('mobile')}
                        className="flex flex-col items-center gap-2 h-auto py-4"
                      >
                        <Smartphone className="w-5 h-5" />
                        <span className="text-xs">Mobile</span>
                      </Button>
                    </div>
                  </div>

                  {/* Botón de Inicio */}
                  <div className="pt-4 border-t">
                    <Button
                      onClick={handleStartRender}
                      disabled={isLoading}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                      size="lg"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Cargando Render...
                        </>
                      ) : (
                        <>
                          <Cube className="w-5 h-5 mr-2" />
                          Iniciar Render 3D
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Área de Render */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cube className="h-5 w-5" />
                    Visualización 3D
                  </CardTitle>
                  <CardDescription>
                    Área de renderizado del almacén en 3D
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center">
                    {isLoading ? (
                      <div className="text-center">
                        <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
                        <p className="text-slate-600 font-medium">Cargando render 3D...</p>
                        <p className="text-sm text-slate-500 mt-2">Dispositivo: {selectedDevice}</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Cube className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-600 font-medium">Render 3D</p>
                        <p className="text-sm text-slate-500 mt-2">Haz clic en "Iniciar Render 3D" para comenzar</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Información del Dispositivo */}
                  <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="text-sm text-purple-800">
                      <strong>Dispositivo seleccionado:</strong> {selectedDevice}
                    </p>
                    <p className="text-xs text-purple-600 mt-1">
                      El render se optimizará para la resolución del dispositivo seleccionado.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
