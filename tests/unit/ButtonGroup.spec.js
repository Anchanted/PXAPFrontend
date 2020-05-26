import { mount } from "@vue/test-utils"
import ButtonGroup from "components/ButtonGroup.vue"

describe('Counter', () => {
  const wrapper = mount(ButtonGroup, {
    propsData: {
      scale: 1,
      buttonList: [["floor","home"]],
      currentFloor: {
        id: 2,
        name: "1F",
        buildingId: 1
      },
      floorList: [
        {
          id: 1,
          name: "GF",
          buildingId: 1
        },
        {
          id: 2,
          name: "1F",
          buildingId: 1
        },
        {
          id: 3,
          name: "1F",
          buildingId: 1
        },
        {
          id: 4,
          name: "2F",
          buildingId: 1
        }
      ],
      buildingCode: "BS",
      occupationTime: null,
      loading: false,
      occupationRequesting: false,
      gateRequesting: false
    }
  })

  // it('renders the correct markup', () => {
  //     expect(wrapper.html()).toContain('<span class="count">0</span>')
  // })

  it("has a button", () => {
      expect(wrapper.contains("button")).toBe(true)
  })
})