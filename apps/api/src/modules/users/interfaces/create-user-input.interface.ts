/**
 * Contrato interno de `UsersService.create()` — deliberadamente desacoplado de
 * qualquer DTO HTTP (`CreateUserDto`, `RegisterDto`). Nenhum DTO decorado com
 * `@ApiProperty`/`class-validator` deve cruzar a fronteira de `UsersService`;
 * quem chama o serviço mapeia seu próprio DTO para este shape primitivo antes
 * de chamar `create()` — mesmo padrão já usado por `ProjectsService.create()`
 * (recebe `{ name, description }`, não `CreateProjectDto`).
 *
 * Design Freeze da SPR-011, seção "Contrato interno entre AuthService e
 * UsersService".
 */
export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
}
