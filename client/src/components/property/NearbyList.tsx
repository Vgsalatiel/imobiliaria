import {
  Bus,
  Cross,
  GraduationCap,
  ShoppingBag,
  ShoppingCart,
  TrainFront,
  Trees,
  type LucideIcon,
} from "lucide-react";
import { NearbyPlace, NearbyPlaceType } from "../../types";
import { formatDistance, NEARBY_LABELS } from "../../utils/format";
import "./NearbyList.css";

const NEARBY_ICON_COMPONENTS: Record<NearbyPlaceType, LucideIcon> = {
  estacao: TrainFront,
  ponto_onibus: Bus,
  praca: Trees,
  mercado: ShoppingCart,
  escola: GraduationCap,
  hospital: Cross,
  shopping: ShoppingBag,
};

export function NearbyList({ places }: { places: NearbyPlace[] }) {
  if (places.length === 0) {
    return <p className="section-subtitle">Nenhum ponto de referência cadastrado.</p>;
  }

  return (
    <ul className="nearby-list">
      {places.map((place) => {
        const Icon = NEARBY_ICON_COMPONENTS[place.type];
        return (
          <li key={`${place.type}-${place.name}`} className="nearby-list__item">
            <span className="nearby-list__icon" aria-hidden>
              <Icon size={18} strokeWidth={2.2} />
            </span>
            <div>
              <span className="nearby-list__name">{place.name}</span>
              <span className="nearby-list__type">{NEARBY_LABELS[place.type]}</span>
            </div>
            <span className="nearby-list__distance">{formatDistance(place.distanceMeters)}</span>
          </li>
        );
      })}
    </ul>
  );
}
