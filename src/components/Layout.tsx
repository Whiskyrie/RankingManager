import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useChampionshipStore } from "../store/championship";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ThemeToggle } from "./ThemeToggle";
import {
  Trophy,
  Users,
  Target,
  Home,
  Settings,
  Menu,
  X,
  Award,
} from "lucide-react";
import { calculateTournamentStats } from "../utils";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentChampionship } = useChampionshipStore();
  const location = useLocation();
  const navigate = useNavigate();

  // Determinar página atual baseada na rota
  const getCurrentPage = () => {
    const path = location.pathname;
    if (path === "/" || path === "/dashboard") return "dashboard";
    if (path === "/athletes") return "athletes";
    if (path === "/groups") return "groups";
    if (path === "/knockout") return "knockout";
    if (path === "/settings") return "settings";
    return "dashboard";
  };

  const currentPage = getCurrentPage();
  const onNavigate = (page: string) => {
    if (page === "dashboard") navigate("/");
    else navigate(`/${page}`);
  };
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    {
      id: "dashboard" as const,
      label: "Dashboard",
      icon: Home,
      description: "Visão geral dos campeonatos",
      available: true,
    },
    {
      id: "groups" as const,
      label: "Fase de Grupos",
      icon: Users,
      description: "Gerenciar grupos e resultados",
      available:
        !!currentChampionship &&
        ["groups", "knockout", "completed"].includes(
          currentChampionship.status
        ),
    },
    {
      id: "knockout" as const,
      label: "Mata-mata",
      icon: Target,
      description: "Chave eliminatória",
      available:
        !!currentChampionship &&
        ["knockout", "completed"].includes(currentChampionship.status),
    },
    {
      id: "athletes" as const,
      label: "Atletas",
      icon: Award,
      description: "Gerenciar atletas",
      available: !!currentChampionship,
    },
    {
      id: "settings" as const,
      label: "Configurações",
      icon: Settings,
      description: "Configurações do campeonato",
      available: !!currentChampionship,
    },
  ];

  const getStatusBadge = () => {
    if (!currentChampionship) return null;

    const statusConfig = {
      created: { label: "Criado", className: "bg-gray-100 text-gray-800" },
      groups: { label: "Grupos", className: "bg-blue-100 text-blue-800" },
      knockout: {
        label: "Mata-mata",
        className: "bg-orange-100 text-orange-800",
      },
      completed: {
        label: "Finalizado",
        className: "bg-green-100 text-green-800",
      },
    };

    const config = statusConfig[currentChampionship.status];
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-surface-elevated shadow-sm border-b border-default sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo e título */}
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 dark:bg-gray-700 p-2 rounded-lg">
                <Trophy className="h-6 w-6 text-white dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-primary">Ranking</h1>
                {currentChampionship && (
                  <p className="text-xs text-secondary hidden sm:block">
                    {currentChampionship.name}
                  </p>
                )}
              </div>
            </div>

            {/* Informações do campeonato atual */}
            <div className="flex items-center gap-4">
              {currentChampionship && (
                <div className="hidden md:flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-medium text-primary">
                      {currentChampionship.name}
                    </div>
                    <div className="text-xs text-secondary">
                      {new Date(currentChampionship.date).toLocaleDateString(
                        "pt-BR"
                      )}
                    </div>
                  </div>
                  {getStatusBadge()}
                </div>
              )}

              {/* Theme Toggle */}
              <ThemeToggle />
            </div>

            {/* Menu mobile */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Menu mobile expandido */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-surface-elevated border-t border-default">
            <div className="px-4 py-2 space-y-1">
              {currentChampionship && (
                <div className="py-2 border-b border-default">
                  <div className="text-sm font-medium text-primary">
                    {currentChampionship.name}
                  </div>
                  <div className="text-xs text-secondary">
                    {new Date(currentChampionship.date).toLocaleDateString(
                      "pt-BR"
                    )}
                  </div>
                  <div className="mt-1">{getStatusBadge()}</div>
                </div>
              )}

              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={currentPage === item.id ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      onNavigate(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    disabled={!item.available}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:pt-16">
          <div className="flex-1 flex flex-col min-h-0 bg-surface-elevated border-r border-default">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.id}
                      variant={currentPage === item.id ? "secondary" : "ghost"}
                      className="w-full justify-start h-12"
                      onClick={() => onNavigate(item.id)}
                      disabled={!item.available}
                    >
                      <Icon className="h-5 w-5 mr-3" />
                      <div className="text-left">
                        <div className="text-sm font-medium">{item.label}</div>
                        <div className="text-xs text-gray-500">
                          {item.description}
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </nav>
            </div>

            {/* Estatísticas rápidas */}
            {currentChampionship && (
              <div className="flex-shrink-0 p-4 border-t border-default bg-surface">
                <div className="text-xs font-medium text-secondary mb-2">
                  Estatísticas Rápidas
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-secondary">Atletas:</span>
                    <span className="text-xs font-medium text-primary">
                      {currentChampionship.totalAthletes}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-secondary">Grupos:</span>
                    <span className="text-xs font-medium text-primary">
                      {currentChampionship.groups.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-secondary">Partidas:</span>
                    <span className="text-xs font-medium text-primary">
                      {currentChampionship.completedMatches}/
                      {currentChampionship.totalMatches}
                    </span>
                  </div>
                  {(() => {
                    const stats = calculateTournamentStats(currentChampionship);
                    if (stats.knockoutMatches > 0) {
                      return (
                        <div className="pt-1 border-t border-default">
                          <div className="flex justify-between">
                            <span className="text-xs text-secondary">
                              Principal:
                            </span>
                            <span className="text-xs font-medium text-primary">
                              {stats.mainKnockoutMatches}
                            </span>
                          </div>
                          {stats.secondDivMatches > 0 && (
                            <div className="flex justify-between">
                              <span className="text-xs text-secondary">
                                2ª Div:
                              </span>
                              <span className="text-xs font-medium text-primary">
                                {stats.secondDivMatches}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Conteúdo principal */}
        <main className="md:pl-64 flex-1">{children}</main>
      </div>
    </div>
  );
};
