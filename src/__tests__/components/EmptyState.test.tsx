import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import EmptyState from "@/components/ui/EmptyState";

describe("EmptyState", () => {
  it("affiche le message principal", () => {
    render(<EmptyState message="Aucune église trouvée." />);
    expect(screen.getByText("Aucune église trouvée.")).toBeInTheDocument();
  });

  it("affiche la description si fournie", () => {
    render(
      <EmptyState
        message="Aucune église trouvée."
        description="Créez votre première église pour commencer."
      />
    );
    expect(
      screen.getByText("Créez votre première église pour commencer.")
    ).toBeInTheDocument();
  });

  it("n'affiche pas de description si non fournie", () => {
    const { container } = render(<EmptyState message="Vide" />);
    const paragraphs = container.querySelectorAll("p");
    expect(paragraphs.length).toBe(1);
  });

  it("affiche le slot action si fourni", () => {
    render(
      <EmptyState
        message="Vide"
        action={<button>Ajouter</button>}
      />
    );
    expect(screen.getByRole("button", { name: "Ajouter" })).toBeInTheDocument();
  });

  it("applique border-dashed par défaut", () => {
    const { container } = render(<EmptyState message="Vide" />);
    expect(container.firstChild).toHaveClass("border-dashed");
  });

  it("n'applique pas border-dashed quand dashed=false", () => {
    const { container } = render(<EmptyState message="Vide" dashed={false} />);
    expect(container.firstChild).not.toHaveClass("border-dashed");
  });
});
