const Header = () => {
  return (
    <header className="sticky top-0 z-50 bg-gradient-to-br from-primary via-[hsl(215,75%,30%)] to-[hsl(215,70%,22%)] text-primary-foreground shadow-[0_2px_16px_-4px_hsl(215,80%,20%/0.4)]">
      <div className="container mx-auto flex items-center justify-center gap-4 px-4 py-3.5">
        <img
          src="https://i.ibb.co/WvQppY7v/logo.png"
          alt="Brasão Prefeitura de Tarrafas"
          className="h-14 w-14 rounded-full bg-white/10 p-1 object-contain ring-2 ring-white/15"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <div>
          <h1 className="text-xl font-bold md:text-2xl font-[Montserrat]">
            Painel do Gestor
          </h1>
          <h2 className="text-xs font-medium opacity-75 md:text-sm font-[Montserrat]">
            Prefeitura Municipal de Tarrafas-CE
          </h2>
        </div>
      </div>
      <div className="h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
    </header>
  );
};

export default Header;
