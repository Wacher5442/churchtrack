import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Button from "@/components/ui/Button";

describe("Button", () => {
  it("affiche le texte de l'enfant", () => {
    render(<Button>Enregistrer</Button>);
    expect(screen.getByRole("button", { name: "Enregistrer" })).toBeInTheDocument();
  });

  it("est désactivé quand disabled=true", () => {
    render(<Button disabled>Enregistrer</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("est désactivé et affiche un spinner quand loading=true", () => {
    render(<Button loading>Enregistrer</Button>);
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    // Le span spinner est présent
    expect(btn.querySelector("span.animate-spin")).toBeTruthy();
  });

  it("appelle onClick quand cliqué", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Cliquer</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("ne déclenche pas onClick quand désactivé", () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Cliquer</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("applique la variante danger", () => {
    render(<Button variant="danger">Supprimer</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("text-danger");
  });

  it("applique la taille sm", () => {
    render(<Button size="sm">Petit</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("h-7");
  });
});
