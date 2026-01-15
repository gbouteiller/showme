import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/episodes/$episodeId')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/episodes/$episodeId"!</div>
}
