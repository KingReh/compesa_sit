# Barra inferior de navegação mobile

## Objetivo
Transformar os acessos às páginas do “Menu de Aplicações” em uma barra horizontal fixa na parte inferior, exclusiva para celulares e tablets, mantendo o menu lateral atual no desktop.

## Implementação
- Criar uma barra inferior com os cinco destinos do sistema: Painel, Férias, Banco de Horas, Relatórios e Configuração.
- Usar os ícones já existentes e rótulos curtos, com o item atual claramente destacado.
- Fazer cada item trocar de página pela mesma fonte de estado já usada pelo menu lateral, preservando o comportamento atual da aplicação.
- Ocultar somente o bloco “Menu de Aplicações” da lateral em telas menores; os demais conteúdos laterais permanecem disponíveis.
- Manter “Instalar App” fora da barra de páginas, pois é uma ação e não uma página do sistema; ela continuará acessível no menu lateral do desktop e pelo aviso de instalação existente.
- Reservar espaço no fim da página para a barra não cobrir tabelas, botões, rodapé ou conteúdo rolável.
- Respeitar a área segura inferior de celulares e o modo PWA instalado.
- Ajustar avisos e o menu flutuante existentes para aparecerem acima da nova barra no mobile, evitando sobreposição.
- Incluir nomes acessíveis, indicação da página ativa e alvos de toque adequados.

## Validação
- Conferir navegação e destaque ativo nos cinco destinos.
- Testar em larguras de celular e tablet, incluindo telas estreitas.
- Verificar rolagem até o fim, área segura e ausência de sobreposição com avisos, modais e menu flutuante.
- Confirmar que o menu lateral permanece inalterado no desktop.

## Escopo técnico
Alterações apenas na interface e navegação local, principalmente na estrutura principal e nos estilos globais. Nenhuma mudança em dados, autenticação ou backend.
