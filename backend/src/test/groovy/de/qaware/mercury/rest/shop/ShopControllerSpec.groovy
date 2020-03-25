package de.qaware.mercury.rest.shop

import de.qaware.mercury.business.location.GeoLocation
import de.qaware.mercury.business.login.PasswordResetToken
import de.qaware.mercury.business.login.ShopLoginService
import de.qaware.mercury.business.login.TokenService
import de.qaware.mercury.business.shop.*
import de.qaware.mercury.rest.plumbing.authentication.AuthenticationHelper
import de.qaware.mercury.rest.shop.dto.request.ResetPasswordDto
import de.qaware.mercury.rest.shop.dto.request.SendCreateLinkDto
import de.qaware.mercury.rest.shop.dto.request.SendPasswordResetLinkDto
import de.qaware.mercury.rest.shop.dto.response.ShopDetailDto
import de.qaware.mercury.rest.shop.dto.response.ShopOwnerDetailDto
import spock.lang.Specification
import spock.lang.Subject

import javax.servlet.http.HttpServletRequest
import java.time.LocalTime
import java.time.ZonedDateTime

class ShopControllerSpec extends Specification {

    @Subject
    ShopController controller

    ShopService shopService = Mock(ShopService)
    TokenService tokenService = Mock(TokenService)
    AuthenticationHelper authenticationHelper = Mock(AuthenticationHelper)
    ShopLoginService shopLoginService = Mock(ShopLoginService)

    HttpServletRequest httpServletRequest = Mock(HttpServletRequest)

    def setup() {
        controller = new ShopController(shopService, tokenService, authenticationHelper, shopLoginService)
    }

    def "Retrieve shop details"() {
        setup:
        UUID id = UUID.randomUUID()
        Shop shop = createShopObject(id)

        when:
        ShopDetailDto result = controller.getShopDetails(id.toString())

        then:
        result
        result.id == id.toString();
        1 * shopService.findById(Shop.Id.parse(id.toString())) >> shop
    }

    def "getShopDetails throws ShopNotFoundException if shop is not found"() {
        setup:
        String id = UUID.randomUUID()
        shopService.findById(Shop.Id.parse(id)) > null

        when:
        controller.getShopDetails(id)

        then:
        thrown ShopNotFoundException
    }

    def "Retrieve shop settings"() {
        setup:
        UUID id = UUID.randomUUID()
        Shop shop = createShopObject(id)

        when:
        ShopOwnerDetailDto result = controller.getShopSettings(httpServletRequest)

        then:
        result.id == shop.id.getId().toString()
        1 * authenticationHelper.authenticateShop(httpServletRequest) >> shop
    }

    def "sendCreateLink calls shopService"() {
        setup:
        String testEmail = "info@example.com"
        SendCreateLinkDto dto = new SendCreateLinkDto(testEmail)

        when:
        controller.sendCreateLink(dto)

        then:
        1 * shopService.sendCreateLink(testEmail)
    }

    def "sendPasswordResetLink calls shopService"() {
        setup:
        String testEmail = "info@example.com"
        SendPasswordResetLinkDto dto = new SendPasswordResetLinkDto(testEmail)

        when:
        controller.sendPasswordResetLink(dto)

        then:
        1 * shopLoginService.sendPasswordResetLink(testEmail)
    }

    def "Resets password"() {
        setup:
        String newPassword = "siodfhsiuh"
        String token = "dksfhsauifh"
        String email = "info@example.com"
        ResetPasswordDto dto = new ResetPasswordDto(newPassword)
        PasswordResetToken passwordResetToken = new PasswordResetToken(token)

        when:
        controller.resetPassword(dto, token)

        then:
        1 * tokenService.verifyPasswordResetToken(_) >> email
        1 * shopLoginService.resetPassword(email, newPassword)
    }

    private static Shop createShopObject(UUID id) {
        return new Shop(
            Shop.Id.parse(id.toString()),
            "Name",
            "Owner Name",
            "info@example.com",
            "Street",
            "23947",
            "City",
            "Address Supplement",
            new HashMap<ContactType, String>(),
            true,
            GeoLocation.of(47, 12),
            "Details",
            "www.example.com",
            createSlotConfig(),
            createZonedDateTime(),
            createZonedDateTime()
        )
    }

    private static SlotConfig createSlotConfig() {
        return new SlotConfig(
            15,
            15,
            new DayConfig(LocalTime.parse("10:00"), LocalTime.parse("11:00")),
            new DayConfig(LocalTime.parse("11:30"), LocalTime.parse("12:30")),
            new DayConfig(LocalTime.parse("13:00"), LocalTime.parse("14:00")),
            new DayConfig(LocalTime.parse("14:30"), LocalTime.parse("15:30")),
            new DayConfig(LocalTime.parse("16:00"), LocalTime.parse("17:00")),
            new DayConfig(LocalTime.parse("17:30"), LocalTime.parse("18:30")),
            new DayConfig(LocalTime.parse("19:00"), LocalTime.parse("20:00"))
        )
    }

    private static ZonedDateTime createZonedDateTime() {
        return ZonedDateTime.now()
    }
}
