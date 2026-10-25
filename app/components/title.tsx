interface TitleProps {
  children?: string;
}

function Title({ children }: TitleProps) {
  let title = "Gestion du culte";

  if (children) {
    title = `${children} - Gestion du culte`;
  }

  return <title>{title}</title>;
}

export { Title };
