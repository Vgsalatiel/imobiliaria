import { useEffect, useMemo, useState } from "react";
import { Home as HomeIcon, MapPinned, ShieldCheck } from "lucide-react";
import { fetchProperties } from "../../api/properties";
import { PropertyCard } from "../../components/property/PropertyCard";
import { PropertyFilters } from "../../components/property/PropertyFilters";
import { Property, PropertyFilters as Filters } from "../../types";
import "./HomePage.css";

export function HomePage() {
  const [filters, setFilters] = useState<Filters>({});
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    fetchProperties(filters)
      .then((data) => {
        if (active) setProperties(data);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [filters, reloadToken]);

  const cityCount = useMemo(
    () => new Set(properties.map((p) => p.city)).size,
    [properties]
  );

  return (
    <div className="home-page">
      <section className="home-hero">
        <video
          className="home-hero__video"
          src="/videos/hero-neighborhood.mp4"
          poster="/videos/hero-neighborhood-poster.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
        />
        <div className="home-hero__overlay" />

        <div className="container home-hero__content">
          <span className="home-hero__eyebrow">Lar&amp;Chave Imóveis</span>
          <h1 className="home-hero__title">Encontre um lugar que combine com você</h1>
          <p className="home-hero__subtitle">
            Imóveis selecionados para comprar ou alugar, com informações completas sobre o
            bairro: praças, estações, pontos de ônibus e muito mais.
          </p>

          <div className="home-hero__trust">
            {!error && (
              <>
                <span>
                  <HomeIcon size={16} strokeWidth={2.2} /> {properties.length} imóveis disponíveis
                </span>
                <span>
                  <MapPinned size={16} strokeWidth={2.2} /> {cityCount || "várias"}{" "}
                  {cityCount === 1 ? "cidade atendida" : "cidades atendidas"}
                </span>
              </>
            )}
            <span>
              <ShieldCheck size={16} strokeWidth={2.2} /> Atendimento direto com o corretor
            </span>
          </div>
        </div>
      </section>

      <div className="container home-page__filters-wrap">
        <PropertyFilters filters={filters} onChange={setFilters} />
      </div>

      <div className="container">
        {loading && (
          <div className="home-page__grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="property-card-skeleton" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="empty-state">
            <p>Não foi possível carregar os imóveis agora. Verifique sua conexão e tente de novo.</p>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ marginTop: 16 }}
              onClick={() => setReloadToken((n) => n + 1)}
            >
              Tentar novamente
            </button>
          </div>
        )}

        {!loading && !error && properties.length === 0 && (
          <div className="empty-state">Nenhum imóvel encontrado com esses filtros.</div>
        )}

        {!loading && !error && properties.length > 0 && (
          <div className="home-page__grid">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
