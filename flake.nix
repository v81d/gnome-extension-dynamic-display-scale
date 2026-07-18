{
  description = "Automatically switch the display scale when switching between desktop and tablet modes.";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
  };

  outputs = {
    self,
    nixpkgs,
  }: let
    system = "x86_64-linux";
    pkgs = import nixpkgs {inherit system;};
  in {
    devShells.x86_64-linux.default = pkgs.mkShell {
      buildInputs = with pkgs; [
        prettier
        vtsls
        vscode-css-languageserver
        vscode-json-languageserver
        lemminx
        glib
      ];
    };
  };
}
