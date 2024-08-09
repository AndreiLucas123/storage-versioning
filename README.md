# storage-versioning

`storage-versioning` é uma biblioteca frontend que utiliza eventos de armazenamento do navegador (`window.storage` event) para sincronizar o `localStorage` entre diferentes abas do navegador. Isso é útil para garantir que as mudanças no armazenamento local sejam refletidas em todas as abas abertas da aplicação.

## Recursos

- Sincronização automática do `localStorage` entre abas
- Gerenciamento de versões de armazenamento local
- Expiração da chave por tempo

## Instalação

Você pode instalar o `storage-versioning` via npm:

```bash
npm install storage-versioning
```

### Documentação

## StorageVersioning

O `StorageVersioning` é um tipo genérico que define uma interface para gerenciar dados versionados no `localStorage`. Ele fornece métodos para carregar, salvar e configurar um listener para mudanças no `localStorage`.

### Métodos

- **load**: Carrega os dados do `localStorage`. Se os dados estiverem expirados ou a versão for diferente, retorna `null`.

  ```ts
  load: () => T | null;
  ```

- **save**: Salva os dados no `localStorage` Se uma data de expiração for definida, os dados serão removidos após essa data. Se os dados forem `null`, eles serão removidos.

  ```ts
  save: (data: T | null, exp?: Date) => void;
  ```

- **setup**: Configura um listener para ouvir mudanças no `localStorage` através do evento de armazenamento da janela. Retorna uma função para remover o listener.
  ```ts
  setup: () => () => void;
  ```

## StorageVersioningJSON

O `StorageVersioningJSON` é o tipo de dado salvo no `localStorage`.

### Estrutura

- **v**: Versão dos dados (string ou número).
- **data**: Dados a serem armazenados.
- **exp**: (Opcional) Data de expiração em milissegundos desde a época Unix.
  ```ts
  export type StorageVersioningJSON<T> = {
    v: string | number;
    data: T;
    exp?: number;
  };
  ```

### Exemplo de Uso

```ts
// Definindo a versão e os dados a serem armazenados
const version = '1.0';
const data = { name: 'John Doe', age: 30 };

// Implementação do StorageVersioning
const storage = storageVersioning<typeof data>('person', 1)

// Salvando dados com expiração de 1 dia
storage.save(data, new Date(Date.now() + 86400000));

// Carregando dados
const loadedData = storage.load();
console.log(loadedData);

// Configurando listener
const removeListener = storage.setup();
```
