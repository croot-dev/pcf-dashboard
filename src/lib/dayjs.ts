import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import quarterOfYear from "dayjs/plugin/quarterOfYear"

dayjs.extend(utc)
dayjs.extend(quarterOfYear)

export default dayjs