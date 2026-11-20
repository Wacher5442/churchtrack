import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Badge, { ReportBadge } from "@/components/ui/Badge";

describe("Badge", () => {
  it("affiche le label", () => {
    render(<Badge variant="success" label="Soumis" />);
    expect(screen.getByText("Soumis")).toBeInTheDocument();
  });

  it("affiche un dot par défaut", () => {
    const { container } = render(<Badge variant="success" label="OK" />);
    const dots = container.querySelectorAll("span.rounded-full");
    // Le wrapper est un span, le dot aussi
    expect(dots.length).toBeGreaterThan(0);
  });

  it("n'affiche pas de dot quand dot=false", () => {
    const { container } = render(<Badge variant="neutral" label="Vide" dot={false} />);
    // Seul le wrapper span, pas de dot interne
    const innerDots = container.querySelectorAll("span.h-1\\.5");
    expect(innerDots.length).toBe(0);
  });

  it("applique la classe pulse sur le dot", () => {
    const { container } = render(<Badge variant="success" label="Actif" pulse />);
    expect(container.querySelector(".animate-pulse")).toBeTruthy();
  });
});

describe("ReportBadge", () => {
  it("affiche 'Soumis' pour SUBMITTED", () => {
    render(<ReportBadge status="SUBMITTED" />);
    expect(screen.getByText("Soumis")).toBeInTheDocument();
  });

  it("affiche 'Brouillon' pour DRAFT", () => {
    render(<ReportBadge status="DRAFT" />);
    expect(screen.getByText("Brouillon")).toBeInTheDocument();
  });

  it("affiche 'Non commencé' pour null", () => {
    render(<ReportBadge status={null} />);
    expect(screen.getByText("Non commencé")).toBeInTheDocument();
  });
});
