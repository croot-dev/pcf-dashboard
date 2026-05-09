declare module "swagger-ui-react" {
  import type { ComponentType } from "react"

  type SwaggerUIProps = {
    spec?: Record<string, unknown>
    url?: string
  }

  const SwaggerUI: ComponentType<SwaggerUIProps>

  export default SwaggerUI
}

declare module "swagger-ui-react/swagger-ui.css"
