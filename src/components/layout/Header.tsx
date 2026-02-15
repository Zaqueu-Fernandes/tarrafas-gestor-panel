const Header = () => {
  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-primary to-[hsl(215,70%,35%)] text-primary-foreground shadow-lg">
      <div className="container mx-auto flex items-center justify-center gap-4 px-4 py-3">
        <img
          src="https://i.ibb.co/WvQppY7v/logo.png"
          alt="Brasão Prefeitura de Tarrafas"
          className="h-14 w-14 rounded-full bg-white/10 p-1 object-contain"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <div>
          <h1 className="text-xl font-bold tracking-tight md:text-2xl font-[Montserrat]">
            Painel do Gestor
          </h1>
          <h2 className="text-xs font-medium opacity-80 md:text-sm font-[Montserrat]">
            Prefeitura Municipal de Tarrafas-CE
          </h2>
        </div>
      </div>
      <div className="h-px bg-white/20" />
    </header>
  );
};

export default Header;
