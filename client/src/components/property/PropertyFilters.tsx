import { PropertyFilters as Filters } from "../../types";
import "./PropertyFilters.css";

interface Props {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

export function PropertyFilters({ filters, onChange }: Props) {
  return (
    <div className="property-filters card-surface">
      <div className="property-filters__group">
        <label>Finalidade</label>
        <select
          value={filters.purpose || ""}
          onChange={(e) =>
            onChange({ ...filters, purpose: (e.target.value || undefined) as Filters["purpose"] })
          }
        >
          <option value="">Todas</option>
          <option value="venda">Comprar</option>
          <option value="aluguel">Alugar</option>
        </select>
      </div>

      <div className="property-filters__group">
        <label>Tipo</label>
        <select
          value={filters.type || ""}
          onChange={(e) =>
            onChange({ ...filters, type: (e.target.value || undefined) as Filters["type"] })
          }
        >
          <option value="">Todos</option>
          <option value="apartamento">Apartamento</option>
          <option value="casa">Casa</option>
          <option value="cobertura">Cobertura</option>
          <option value="terreno">Terreno</option>
          <option value="comercial">Comercial</option>
        </select>
      </div>

      <div className="property-filters__group property-filters__group--city">
        <label>Cidade</label>
        <input
          type="text"
          placeholder="Ex: Belo Horizonte"
          value={filters.city || ""}
          onChange={(e) => onChange({ ...filters, city: e.target.value || undefined })}
        />
      </div>

      <div className="property-filters__group">
        <label>Preço mín.</label>
        <input
          type="number"
          min={0}
          placeholder="R$"
          value={filters.minPrice ?? ""}
          onChange={(e) =>
            onChange({
              ...filters,
              minPrice: e.target.value ? Number(e.target.value) : undefined,
            })
          }
        />
      </div>

      <div className="property-filters__group">
        <label>Preço máx.</label>
        <input
          type="number"
          min={0}
          placeholder="R$"
          value={filters.maxPrice ?? ""}
          onChange={(e) =>
            onChange({
              ...filters,
              maxPrice: e.target.value ? Number(e.target.value) : undefined,
            })
          }
        />
      </div>

      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => onChange({})}
      >
        Limpar
      </button>
    </div>
  );
}
