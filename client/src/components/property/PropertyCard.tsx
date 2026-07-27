import { MouseEvent, useState } from "react";
import { Link } from "react-router-dom";
import { BedDouble, Heart, MapPin, Ruler, UserRound } from "lucide-react";
import { Property } from "../../types";
import { formatPrice, PURPOSE_LABELS, TYPE_LABELS } from "../../utils/format";
import "./PropertyCard.css";

export function PropertyCard({ property }: { property: Property }) {
  const [favorited, setFavorited] = useState(false);

  function toggleFavorite(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setFavorited((prev) => !prev);
  }

  return (
    <Link to={`/imoveis/${property.id}`} className="property-card">
      <div className="property-card__image-wrap">
        <img src={property.coverImage} alt={property.title} loading="lazy" />
        <span className="property-card__purpose">{PURPOSE_LABELS[property.purpose]}</span>
        <button
          type="button"
          className={`property-card__favorite ${favorited ? "is-active" : ""}`}
          onClick={toggleFavorite}
          aria-label="Favoritar imóvel"
        >
          <Heart size={18} strokeWidth={2.4} fill={favorited ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="property-card__body">
        <span className="property-card__price">{formatPrice(property.price, property.purpose)}</span>
        <h3 className="property-card__title">{property.title}</h3>
        <p className="property-card__location">
          <MapPin size={16} strokeWidth={2.2} />
          {property.neighborhood}, {property.city} - {property.state}
        </p>
        <div className="property-card__meta">
          <span>{TYPE_LABELS[property.type]}</span>
          {property.bedrooms > 0 && (
            <span>
              <BedDouble size={16} strokeWidth={2.2} /> {property.bedrooms}
            </span>
          )}
          <span>
            <Ruler size={16} strokeWidth={2.2} /> {property.areaM2} m²
          </span>
        </div>
        {property.corretorName && (
          <div className="property-card__corretor">
            <UserRound size={14} strokeWidth={2.2} />
            Corretor responsável: <strong>{property.corretorName}</strong>
          </div>
        )}
      </div>
    </Link>
  );
}
