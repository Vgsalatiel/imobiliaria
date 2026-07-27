import { MouseEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Bath,
  BedDouble,
  Building2,
  Car,
  CheckCircle2,
  Heart,
  MapPin,
  MessageCircle,
  Ruler,
  UserRound,
} from "lucide-react";
import { fetchProperties, fetchPropertyById } from "../../api/properties";
import { Property, PropertyWithNearby } from "../../types";
import {
  formatPrice,
  PURPOSE_LABELS,
  TYPE_LABELS,
} from "../../utils/format";
import { NearbyList } from "../../components/property/NearbyList";
import { Modal } from "../../components/common/Modal";
import { ContactBrokerForm } from "../../components/property/ContactBrokerForm";
import { PropertyCard } from "../../components/property/PropertyCard";
import "./PropertyDetailPage.css";

export function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<PropertyWithNearby | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [favorited, setFavorited] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactSent, setContactSent] = useState(false);
  const [similar, setSimilar] = useState<Property[]>([]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(false);
    setActiveImage(0);
    setFavorited(false);
    fetchPropertyById(Number(id))
      .then(setProperty)
      .catch((err) => {
        // 404 é "imóvel não encontrado" (mensagem própria mais abaixo), não uma falha de rede.
        if (err?.response?.status !== 404) setError(true);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!property) return;
    let active = true;
    fetchProperties({ type: property.type }).then((data) => {
      if (active) setSimilar(data.filter((p) => p.id !== property.id).slice(0, 3));
    });
    return () => {
      active = false;
    };
  }, [property]);

  function toggleFavorite(e: MouseEvent) {
    e.preventDefault();
    setFavorited((prev) => !prev);
  }

  if (loading) return <div className="spinner" />;

  if (error) {
    return (
      <div className="container empty-state">
        <p>Não foi possível carregar este imóvel agora. Verifique sua conexão e tente de novo.</p>
        <Link to="/" className="btn btn-secondary" style={{ marginTop: 16 }}>
          Voltar para os imóveis
        </Link>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="container empty-state">
        <p>Imóvel não encontrado.</p>
        <Link to="/" className="btn btn-secondary" style={{ marginTop: 16 }}>
          Voltar para os imóveis
        </Link>
      </div>
    );
  }

  const images = property.images.length > 0 ? property.images : [property.coverImage];

  return (
    <div className="container property-detail">
      <Link to="/" className="property-detail__back">
        <ArrowLeft size={16} strokeWidth={2.2} /> Voltar para os imóveis
      </Link>

      <div className="property-detail__heading">
        <p className="property-detail__breadcrumb">
          {TYPE_LABELS[property.type]} para {PURPOSE_LABELS[property.purpose].toLowerCase()} em{" "}
          {property.neighborhood}, {property.city}
        </p>
        <h1 className="property-detail__title">{property.title}</h1>
      </div>

      <div className="property-detail__layout">
        <div className="property-detail__main">
          <div className="property-detail__gallery">
            <img src={images[activeImage]} alt={property.title} />
            <span className="property-detail__gallery-purpose">
              {PURPOSE_LABELS[property.purpose]}
            </span>
            <button
              type="button"
              className={`property-detail__gallery-favorite ${favorited ? "is-active" : ""}`}
              onClick={toggleFavorite}
              aria-label="Favoritar imóvel"
            >
              <Heart size={18} strokeWidth={2.4} fill={favorited ? "currentColor" : "none"} />
            </button>
          </div>
          {images.length > 1 && (
            <div className="property-detail__thumbs">
              {images.map((img, index) => (
                <button
                  key={img + index}
                  type="button"
                  className={index === activeImage ? "is-active" : ""}
                  onClick={() => setActiveImage(index)}
                >
                  <img src={img} alt="" />
                </button>
              ))}
            </div>
          )}

          <section className="property-detail__section">
            <h2>Sobre o imóvel</h2>
            <p className="property-detail__description">{property.description}</p>
          </section>

          <section className="property-detail__section">
            <h2>O que tem por perto</h2>
            <NearbyList places={property.nearbyPlaces} />
          </section>
        </div>

        <aside className="property-detail__sidebar card-surface">
          <strong className="property-detail__price">
            {formatPrice(property.price, property.purpose)}
          </strong>
          <p className="property-detail__location">
            <MapPin size={15} strokeWidth={2.2} />
            {property.neighborhood}, {property.city} - {property.state}
          </p>

          {property.corretorName && (
            <p className="property-detail__corretor">
              <UserRound size={15} strokeWidth={2.2} />
              Corretor responsável: <strong>{property.corretorName}</strong>
            </p>
          )}

          <div className="property-detail__facts">
            <div>
              <span className="property-detail__fact-icon">
                <Building2 size={16} strokeWidth={2.2} />
              </span>
              <strong>{TYPE_LABELS[property.type]}</strong>
              <span>Tipo</span>
            </div>
            <div>
              <span className="property-detail__fact-icon">
                <Ruler size={16} strokeWidth={2.2} />
              </span>
              <strong>{property.areaM2} m²</strong>
              <span>Área</span>
            </div>
            {property.bedrooms > 0 && (
              <div>
                <span className="property-detail__fact-icon">
                  <BedDouble size={16} strokeWidth={2.2} />
                </span>
                <strong>{property.bedrooms}</strong>
                <span>Quartos</span>
              </div>
            )}
            {property.bathrooms > 0 && (
              <div>
                <span className="property-detail__fact-icon">
                  <Bath size={16} strokeWidth={2.2} />
                </span>
                <strong>{property.bathrooms}</strong>
                <span>Banheiros</span>
              </div>
            )}
            {property.parkingSpots > 0 && (
              <div>
                <span className="property-detail__fact-icon">
                  <Car size={16} strokeWidth={2.2} />
                </span>
                <strong>{property.parkingSpots}</strong>
                <span>Vagas</span>
              </div>
            )}
          </div>

          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={() => {
              setContactSent(false);
              setShowContactModal(true);
            }}
          >
            <MessageCircle size={17} strokeWidth={2.2} />
            Falar com o corretor
          </button>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="property-detail__similar">
          <h2>Imóveis semelhantes</h2>
          <div className="property-detail__similar-grid">
            {similar.map((item) => (
              <PropertyCard key={item.id} property={item} />
            ))}
          </div>
        </section>
      )}

      {showContactModal && (
        <Modal title="Falar com o corretor" onClose={() => setShowContactModal(false)}>
          {contactSent ? (
            <div className="property-detail__contact-success">
              <CheckCircle2 size={40} strokeWidth={1.8} className="property-detail__success-icon" />
              <p>
                {property.corretorWhatsapp
                  ? "Solicitação enviada! Abrimos o WhatsApp do corretor para você combinar a visita diretamente com ele."
                  : "Solicitação enviada! O corretor entrará em contato em breve para combinar a visita."}
              </p>
              <button
                type="button"
                className="btn btn-secondary btn-block"
                onClick={() => setShowContactModal(false)}
              >
                Fechar
              </button>
            </div>
          ) : (
            <ContactBrokerForm
              propertyId={property.id}
              propertyTitle={property.title}
              propertyLocation={`${property.neighborhood}, ${property.city}`}
              corretorName={property.corretorName}
              corretorWhatsapp={property.corretorWhatsapp}
              onSuccess={() => setContactSent(true)}
            />
          )}
        </Modal>
      )}
    </div>
  );
}
