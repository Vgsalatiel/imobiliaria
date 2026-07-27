import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Images,
  MapPin,
  PlusCircle,
  Ruler,
  Save,
  SignpostBig,
  Trash2,
  Users,
} from "lucide-react";
import { createPropertyAdmin } from "../../api/properties";
import { fetchCorretores } from "../../api/auth";
import { useAuth } from "../../context/AuthContext";
import { Corretor, NearbyPlaceType } from "../../types";
import "./NewPropertyPage.css";

interface NearbyRow {
  type: NearbyPlaceType;
  name: string;
  distanceMeters: string;
}

const NEARBY_TYPE_OPTIONS: { value: NearbyPlaceType; label: string }[] = [
  { value: "estacao", label: "Estação" },
  { value: "ponto_onibus", label: "Ponto de ônibus" },
  { value: "praca", label: "Praça" },
  { value: "mercado", label: "Mercado" },
  { value: "escola", label: "Escola" },
  { value: "hospital", label: "Hospital" },
  { value: "shopping", label: "Shopping" },
];

function emptyNearbyRow(): NearbyRow {
  return { type: "praca", name: "", distanceMeters: "" };
}

export function NewPropertyPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [corretores, setCorretores] = useState<Corretor[]>([]);
  const [corretorId, setCorretorId] = useState<number | "">("");

  useEffect(() => {
    if (!isAdmin) return;
    fetchCorretores().then((list) => {
      setCorretores(list);
      setCorretorId((current) => (current === "" && list[0] ? list[0].id : current));
    });
  }, [isAdmin]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [purpose, setPurpose] = useState("venda");
  const [type, setType] = useState("apartamento");
  const [bedrooms, setBedrooms] = useState("0");
  const [bathrooms, setBathrooms] = useState("0");
  const [parkingSpots, setParkingSpots] = useState("0");
  const [areaM2, setAreaM2] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("MG");
  const [addressLine, setAddressLine] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [imagesText, setImagesText] = useState("");
  const [nearbyRows, setNearbyRows] = useState<NearbyRow[]>([emptyNearbyRow()]);

  function updateNearbyRow(index: number, patch: Partial<NearbyRow>) {
    setNearbyRows((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function removeNearbyRow(index: number) {
    setNearbyRows((rows) => rows.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const images = imagesText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      await createPropertyAdmin({
        title,
        description,
        price: Number(price),
        purpose,
        type,
        bedrooms: Number(bedrooms),
        bathrooms: Number(bathrooms),
        parkingSpots: Number(parkingSpots),
        areaM2: Number(areaM2),
        neighborhood,
        city,
        state,
        addressLine,
        coverImage: coverImage || images[0] || "",
        images: images.length > 0 ? images : coverImage ? [coverImage] : [],
        nearbyPlaces: nearbyRows
          .filter((row) => row.name.trim() && row.distanceMeters)
          .map((row) => ({
            type: row.type,
            name: row.name.trim(),
            distanceMeters: Number(row.distanceMeters),
          })),
        ...(isAdmin && corretorId ? { corretorId: Number(corretorId) } : {}),
      });

      navigate("/admin/imoveis");
    } catch {
      setError("Não foi possível salvar o imóvel. Verifique os campos e tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="new-property-page">
      <h1 className="page-title">Novo imóvel</h1>
      <p className="section-subtitle">Cadastre um imóvel para exibir no site.</p>

      <form onSubmit={handleSubmit} className="new-property-form">
        <section className="card-surface form-section">
          <h2 className="form-section__title">
            <FileText size={17} strokeWidth={2.2} /> Informações gerais
          </h2>

          <div className="field">
            <label htmlFor="title">Título</label>
            <input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="field">
            <label htmlFor="description">Descrição</label>
            <textarea
              id="description"
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {isAdmin && (
            <div className="field">
              <label htmlFor="corretorId">
                <Users size={14} strokeWidth={2.2} style={{ verticalAlign: "-2px" }} /> Corretor
                responsável
              </label>
              <select
                id="corretorId"
                value={corretorId}
                onChange={(e) => setCorretorId(e.target.value ? Number(e.target.value) : "")}
              >
                {corretores.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.role === "admin" ? "Administrador" : "Corretor"})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="field-row">
            <div className="field">
              <label htmlFor="purpose">Finalidade</label>
              <select id="purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)}>
                <option value="venda">Venda</option>
                <option value="aluguel">Aluguel</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="type">Tipo</label>
              <select id="type" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="apartamento">Apartamento</option>
                <option value="casa">Casa</option>
                <option value="cobertura">Cobertura</option>
                <option value="terreno">Terreno</option>
                <option value="comercial">Comercial</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="price">Preço (R$)</label>
              <input
                id="price"
                type="number"
                min={0}
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="card-surface form-section">
          <h2 className="form-section__title">
            <Ruler size={17} strokeWidth={2.2} /> Características
          </h2>

          <div className="field-row">
            <div className="field">
              <label htmlFor="bedrooms">Quartos</label>
              <input
                id="bedrooms"
                type="number"
                min={0}
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="bathrooms">Banheiros</label>
              <input
                id="bathrooms"
                type="number"
                min={0}
                value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="parkingSpots">Vagas</label>
              <input
                id="parkingSpots"
                type="number"
                min={0}
                value={parkingSpots}
                onChange={(e) => setParkingSpots(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="areaM2">Área (m²)</label>
              <input
                id="areaM2"
                type="number"
                min={0}
                required
                value={areaM2}
                onChange={(e) => setAreaM2(e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="card-surface form-section">
          <h2 className="form-section__title">
            <MapPin size={17} strokeWidth={2.2} /> Localização
          </h2>

          <div className="field-row">
            <div className="field">
              <label htmlFor="neighborhood">Bairro</label>
              <input
                id="neighborhood"
                required
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="city">Cidade</label>
              <input id="city" required value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="state">UF</label>
              <input
                id="state"
                required
                maxLength={2}
                value={state}
                onChange={(e) => setState(e.target.value.toUpperCase())}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="addressLine">Endereço / referência</label>
            <input
              id="addressLine"
              value={addressLine}
              onChange={(e) => setAddressLine(e.target.value)}
              placeholder="Ex: Rua das Flores, próximo à Praça Central"
            />
          </div>
        </section>

        <section className="card-surface form-section">
          <h2 className="form-section__title">
            <Images size={17} strokeWidth={2.2} /> Imagens
          </h2>

          <div className="field">
            <label htmlFor="coverImage">URL da imagem de capa</label>
            <input
              id="coverImage"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="field">
            <label htmlFor="images">Outras imagens (uma URL por linha)</label>
            <textarea
              id="images"
              rows={3}
              value={imagesText}
              onChange={(e) => setImagesText(e.target.value)}
              placeholder={"https://...\nhttps://..."}
            />
          </div>
        </section>

        <section className="card-surface form-section">
          <div className="new-property-form__nearby-header">
            <h2 className="form-section__title" style={{ marginBottom: 0 }}>
              <SignpostBig size={17} strokeWidth={2.2} /> Pontos de referência
            </h2>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setNearbyRows((rows) => [...rows, emptyNearbyRow()])}
            >
              <PlusCircle size={16} strokeWidth={2.2} />
              Adicionar ponto
            </button>
          </div>

          {nearbyRows.map((row, index) => (
            <div className="new-property-form__nearby-row" key={index}>
              <select
                value={row.type}
                onChange={(e) =>
                  updateNearbyRow(index, { type: e.target.value as NearbyPlaceType })
                }
              >
                {NEARBY_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <input
                placeholder="Nome (ex: Praça da Savassi)"
                value={row.name}
                onChange={(e) => updateNearbyRow(index, { name: e.target.value })}
              />
              <input
                type="number"
                min={0}
                placeholder="Distância (m)"
                value={row.distanceMeters}
                onChange={(e) => updateNearbyRow(index, { distanceMeters: e.target.value })}
              />
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => removeNearbyRow(index)}
              >
                <Trash2 size={15} strokeWidth={2.2} />
              </button>
            </div>
          ))}
        </section>

        {error && <p style={{ color: "var(--color-danger)", margin: "4px 0" }}>{error}</p>}

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          <Save size={17} strokeWidth={2.2} />
          {submitting ? "Salvando..." : "Cadastrar imóvel"}
        </button>
      </form>
    </div>
  );
}
