# Corrigir aviso de chave no mapa escuro

## Diagnóstico confirmado

O tema escuro usa blocos de mapa gratuitos da CARTO sem chave. O próprio provedor passou a gravar nesses blocos a marca d’água “API KEY REQUIRED”, por isso o texto aparece repetido no mapa. Não é um erro nos dados, marcadores ou coordenadas do SIT.

## Alteração proposta

- Substituir a camada escura da CARTO por uma camada sem exigência de chave, aplicando o tratamento visual escuro dentro do próprio mapa.
- Fazer a troca tanto no mapa incorporado da página quanto no Painel Geográfico aberto pelo botão “Exibir Mapa”.
- Preservar os demais estilos, marcadores, zoom salvo, centro salvo, filtros e ferramentas de medição/rota.
- Incluir a atribuição obrigatória do provedor de mapas de forma discreta e legível.
- Validar no desktop e no celular que o aviso desapareceu e que os blocos carregam corretamente.

## Limites

Nenhuma chave será criada ou solicitada, e nenhuma regra de negócio ou dado do sistema será alterado.
