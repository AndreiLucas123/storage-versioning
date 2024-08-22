# storage-versioning

`storage-versioning` é uma biblioteca frontend que utiliza eventos de armazenamento do navegador (`window.storage` event) para sincronizar o `localStorage` entre diferentes abas do navegador. Isso é útil para garantir que as mudanças no armazenamento local sejam refletidas em todas as abas abertas da aplicação.

## Recursos

- Sincronização automática do `localStorage` entre abas
- Gerenciamento de versões de `localStorage` com versão ou `schemas` (como Zod)
- Expiração da chave por tempo
- Reatividade com frameworks como `Vue`, `Angular`, `SolidJS`, `PreactJS` usando o [signal-factory](https://github.com/Simple-Organization/signal-factory)

## Instalação

Você pode instalar o `storage-versioning` via npm:

```bash
npm i storage-versioning
pnpm i storage-versioning
yarn add storage-versioning
```

### Definindo grupo

```ts
const group = storageGroup({
  person: storageItem<typeof data>('person', 1),
  user: storageItem<any>('user'), // Versão é opcional
});
```

### Lendo dados

```ts
// Carrega todos os dados do grupo
group.load();

// Você pode chamar individualmente também
group.person.load();
```

### Salvando dados

```ts
group.person.save({ name: 'John Doe', age: 30 });

// Salvando dados com expiração de 1 dia
group.person.save(data, new Date(Date.now() + 86400000));

group.person.value = { name: 'John Doe', age: 30 }; // Não salva
```

### Versionamento e validação

Você pode controlar um item pela versão dele, ou por um schema como do [Zod](https://zod.dev/) ou [Yup](https://github.com/jquense/yup)

```ts
// Com versionamento por string ou number
let group = storageGroup({
  person1: storageItem<typeof data>('person1', 1),
  person2: storageItem<typeof data>('person2', 'v3.0'),
  user: storageItem<any>('user'), // Opcional, pode ser mudada depois
});

// Com lib como zod
const schema = z
  .object({
    name: z.string(),
  })
  .catch({ name: 'Jhon' });

let group = storageGroup({
  person: storageItem<typeof data>('person', (data) => schema.parse(data)),
});
```

A validação com a lib ocorrerá sempre que chamar `.save` ou `load`

É recomendado usar recurso como `.catch` do zod para dados que possam vir incorretos

### Configurando reatividade (signals)

Essa lib usa [signal-factory](https://github.com/Simple-Organization/signal-factory) para configurar a reatividade entre `React`, `Preact`. `Svelte`, `Vue`, `Solid`

### Acessando a reatividade

```ts
// Só chamar .value
group.person.value;
```

### Testing

Para ambientes de testes automatizados, o recomendado é usar o `storageItemTesting`, a api é a mesma que o `storageItem`, porém ele não acessa o `localStorage` e também os dados não expiram, tendo maior performance nas execuções dos testes

```ts
let group = storageGroup({
  person: storageItem<typeof data>('person', 1),
  user: storageItem<any>('user'),
});

// Sobreescreve para testes
if (testing) {
  group = storageGroup({
    person: storageItemTesting<typeof data>('person', 1),
    user: storageItemTesting<any>('user'),
  });
}

// Só adiciona o window.addEventListener('storage') se não está em testes
if (!testing) {
  group.listen();
}
```

---

### Tipo JSON salvo

- **v**: Versão dos dados (string ou número).
- **data**: Dados a serem armazenados.
- **exp**: Data de expiração em milissegundos desde a época Unix.
  ```ts
  export type StorageVersioningJSON<T> = {
    data: T;
    v?: string | number;
    exp?: number;
  };
  ```
